export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-6 animate-fade-in">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Loading...</p>
            </div>
        </div>
    );
}
