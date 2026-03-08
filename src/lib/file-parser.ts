'use client';

/**
 * Client-side PDF and TXT text extraction utility.
 * Uses pdfjs-dist (installed) for PDFs and native FileReader for TXT.
 * Zero server cost — all processing happens in the browser.
 */

export async function extractTextFromFile(file: File): Promise<string> {
    const name = file.name.toLowerCase();

    if (name.endsWith('.txt') || name.endsWith('.text')) {
        return readTextFile(file);
    }

    if (name.endsWith('.pdf')) {
        return readPDFFile(file);
    }

    throw new Error('Unsupported file type. Please upload a .pdf or .txt file.');
}

/** Read plain text file using FileReader */
function readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
    });
}

/** Extract text from PDF using pdfjs-dist */
async function readPDFFile(file: File): Promise<string> {
    try {
        // Dynamic import to keep it out of the main bundle
        const pdfjsLib = await import('pdfjs-dist');

        // Use the bundled worker via CDN for broad compatibility
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
            data: new Uint8Array(arrayBuffer),
        }).promise;

        const textParts: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
                .filter((item: any) => 'str' in item)
                .map((item: any) => item.str)
                .join(' ');
            textParts.push(pageText);
        }

        const fullText = textParts.join('\n\n').trim();

        if (!fullText) {
            throw new Error(
                'Could not extract text from this PDF. It may be image-based (scanned). Please copy and paste the text manually.'
            );
        }

        return fullText;
    } catch (err) {
        if (
            err instanceof Error &&
            (err.message.includes('Could not extract') ||
                err.message.includes('image-based'))
        ) {
            throw err;
        }
        console.error('PDF parse error:', err);
        throw new Error(
            'Failed to parse PDF. Please try a different file or paste your resume text manually.'
        );
    }
}
