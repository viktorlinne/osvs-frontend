import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getPost, updatePost } from "../services";
import useFetch from "../hooks/useFetch";
import { Spinner, NotFound } from "../components";
import { useError } from "../context";
import type { Post } from "../types";

export default function EditPost() {
    const { id } = useParams<{ id: string }>();
    const { setError, clearError } = useError();
    const navigate = useNavigate();

    const { loading: loadingPost, notFound, run: runFetch } = useFetch<Post | null>();
    const { run: runSubmit, loading: submitting } = useFetch<{ success: boolean }>();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [picture, setPicture] = useState<File | null>(null);

    useEffect(() => {
        let mounted = true;
        if (!id) {
            setError("Missing post id");
            return;
        }
        (async () => {
            try {
                const p = await runFetch(() => getPost(id));
                if (!mounted) return;
                if (p) {
                    setTitle(p.title);
                    setDescription(p.description);
                }
            } catch {
                /* handled by useFetch */
            }
        })();
        return () => {
            mounted = false;
        };
    }, [id, runFetch, setError]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        clearError();
        if (!title.trim() || !description.trim()) {
            setError("Titel och beskrivning är obligatoriska");
            return;
        }

        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("description", description.trim());
        if (picture) fd.append("picture", picture);

        try {
            await runSubmit(() => updatePost(id as string, fd as unknown as Record<string, unknown>));
            navigate(`/news/${id}`);
        } catch {
            // errors handled by useFetch -> useError
        }
    }

    return (
        <div className="flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full mx-auto p-6">
                <Link to="/news" className="text-sm text-green-600 underline">
                    ← Tillbaka till nyheter
                </Link>

                <h2 className="text-2xl font-bold mt-4 mb-4">Redigera inlägg</h2>

                {loadingPost && <Spinner />}
                {notFound ? (
                    <NotFound />
                ) : (
                    <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow">
                        <div className="mb-4">
                            <label className="block font-medium mb-1">Titel</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block font-medium mb-1">Beskrivning</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block font-medium mb-1">Bild (valfritt)</label>
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
                                disabled={submitting}
                            >
                                Spara
                            </button>
                            {(submitting || loadingPost) && <Spinner />}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
