import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPost } from "../services";
import useFetch from "../hooks/useFetch";
import { Spinner } from "../components";
import { useError } from "../context";
import { createPostSchema, type CreatePostForm } from "../validators/posts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";


export default function CreatePost() {
    const { clearError: clearGlobalError } = useError();
    const { run, loading } = useFetch<{ success: boolean; id?: number }>();
    const navigate = useNavigate();

    const [picture, setPicture] = useState<File | null>(null);
    const { register, handleSubmit, formState: { errors }, setError: setFieldError } = useForm<CreatePostForm>({
        resolver: zodResolver(createPostSchema),
        defaultValues: { title: "", description: "" }
    });

    async function onSubmit(values: CreatePostForm) {
        clearGlobalError();
        const fd = new FormData();
        fd.append("title", values.title.trim());
        fd.append("description", String(values.description ?? "").trim());
        if (picture) fd.append("picture", picture);

        try {
            const res = await run(() => createPost(fd as unknown as Record<string, unknown>));
            const id = res?.id ?? null;
            if (id) navigate(`/news/${id}`);
            else navigate("/news");
        } catch (e: unknown) {
            // map server-side validation errors to fields when possible
            const err = e as { status?: number; details?: unknown };
            if (err?.status === 400 && err.details && typeof err.details === "object") {
                const rec = err.details as Record<string, unknown>;
                const missing = Array.isArray(rec.missing) ? rec.missing : undefined;
                if (missing) {
                    missing.forEach((p: unknown) => {
                        if (typeof p === "string") {
                            setFieldError(p as unknown as keyof CreatePostForm, { type: "server", message: "Ogiltigt värde" });
                        }
                    });
                    return;
                }
            }
            // otherwise rely on global error handling
        }
    }

    return (
        <div className="flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full mx-auto p-6">
                <Link to="/news" className="text-sm text-green-600 underline">
                    ← Tillbaka till nyheter
                </Link>
                <h2 className="text-2xl font-bold mt-4 mb-4">Skapa inlägg</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded shadow">
                    <div className="mb-4">
                        <label className="block font-medium mb-1">Titel</label>
                        <input
                            {...register("title")}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.title && <div className="text-red-600 mt-1">{errors.title?.message}</div>}
                    </div>

                    <div className="mb-4">
                        <label className="block font-medium mb-1">Beskrivning</label>
                        <textarea
                            {...register("description")}
                            rows={6}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.description && <div className="text-red-600 mt-1">{errors.description?.message}</div>}
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
                            disabled={loading}
                        >
                            Skapa
                        </button>
                        {loading && <Spinner />}
                    </div>
                </form>
            </div>
        </div>
    );
}
