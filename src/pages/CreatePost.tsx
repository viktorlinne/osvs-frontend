import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPost } from "../services";
import useFetch from "../hooks/useFetch";
import { Spinner } from "../components";
import { useError } from "../context";

export default function CreatePost() {
    const { setError } = useError();
    const { run, loading } = useFetch<{ success: boolean; id?: number }>();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [picture, setPicture] = useState<File | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!title.trim() || !description.trim()) {
            setError("Title and description are required");
            return;
        }

        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("description", description.trim());
        if (picture) fd.append("picture", picture);

        try {
            const res = await run(() => createPost(fd as unknown as Record<string, unknown>));
            // backend returns { success: true, id }
            const id = res?.id ?? null;
            if (id) navigate(`/news/${id}`);
            else navigate("/news");
        } catch {
            // errors handled by useFetch -> useError
        }
    }

    return (
        <div className="flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full mx-auto p-6">
                <Link to="/news" className="text-sm text-green-600 underline">
                    ← Back to news
                </Link>
                <h2 className="text-2xl font-bold mt-4 mb-4">Create Post</h2>
                <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow">
                    <div className="mb-4">
                        <label className="block font-medium mb-1">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block font-medium mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block font-medium mb-1">Picture (optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPicture(e.target.files ? e.target.files[0] : null)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
                            disabled={loading}
                        >
                            Create
                        </button>
                        {loading && <Spinner />}
                    </div>
                </form>
            </div>
        </div>
    );
}
