"use client"

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold">Page not found</h1>
                <p className="text-muted-foreground mt-2">We couldn\'t find the page you requested.</p>
            </div>
        </div>
    );
}
