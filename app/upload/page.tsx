"use client";

import { useState } from "react";

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            ;

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Upload failed");
            }

            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 40 }}>
            <h1>Upload PDF / Image</h1>

            <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <br /><br />

            <button onClick={handleUpload} disabled={loading}>
                {loading ? "Processing..." : "Upload"}
            </button>

            <br /><br />

            {error && <p style={{ color: "red" }}>{error}</p>}

            {result && (
                <div>
                    <h2>Result</h2>
                    <p><b>Filename:</b> {result.filename}</p>
                    <p><b>Total Chunks:</b> {result.total_chunks}</p>

                    <pre style={{ whiteSpace: "pre-wrap", maxHeight: 400, overflow: "auto" }}>
                        {JSON.stringify(result.chunks, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
