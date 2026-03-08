import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
    const authResult = await verifyAuth(req);
    if (isAuthError(authResult)) return authResult;

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Security: Limit file size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
        }

        // Security: Verify file type by name check
        if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
            return NextResponse.json({ error: 'Invalid file type. Please upload a PDF.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // H-2 FIX: Validate actual PDF content by checking magic bytes
        const pdfHeader = buffer.toString('ascii', 0, 5);
        if (!pdfHeader.startsWith('%PDF-')) {
            return NextResponse.json(
                { error: 'Invalid PDF file. The uploaded file does not appear to be a valid PDF.' },
                { status: 400 }
            );
        }

        // Lazy require inside handler to avoid pdf-parse loading its test PDF at module init
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);

        return NextResponse.json({ text: data.text });
    } catch (error) {
        console.error('PDF Parse Error:', error);
        return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
    }
}
