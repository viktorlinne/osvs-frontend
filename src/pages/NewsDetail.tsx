import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context";
import { getPost, updatePost } from "../services";
import { Spinner, NotFound } from "../components";
import type { Post } from "../types";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePostSchema } from "../validators/posts";
import { z } from "zod";

export const NewsDetail = () => {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const { error, setError: setGlobalError, clearError: clearGlobalError } = useError();
    const { data:post, loading, notFound, run } = useFetch<Post | null>();
    const { run: runSubmit, loading: submitting } = useFetch<{ success: boolean }>();
    const navigate = useNavigate();
    const location = useLocation();

    const canEdit = Boolean(user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)));
    const isEditRoute = location.pathname.endsWith("/edit");

    const [picture, setPicture] = useState<File | null>(null);

    type UpdatePostForm = z.infer<typeof updatePostSchema>;
    const { register, handleSubmit, setError: setFieldError, reset, formState: { errors } } = useForm<UpdatePostForm>({
        resolver: zodResolver(updatePostSchema),
        defaultValues: { title: "", description: "" },
    });

    useEffect(() => {
        let mounted = true;
        if (!id) {
            setGlobalError("Saknar inläggs-id");
            return () => {
                mounted = false;
            };
        }

        (async () => {
            try {
                clearGlobalError();
                const normalized = await run(() => getPost(id));
                if (!mounted) return;
                if (normalized) {
                    reset({ title: normalized.title ?? "", description: normalized.description ?? "" });
                }
            } catch {
                /* handled by useFetch */
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id, clearGlobalError, setGlobalError, run, reset]);

    async function onSubmit(values: UpdatePostForm) {
        clearGlobalError();

        const fd = new FormData();
        if (values.title && String(values.title).trim()) fd.append("title", String(values.title).trim());
        if (values.description && String(values.description).trim()) fd.append("description", String(values.description).trim());
        if (picture) fd.append("picture", picture);

        try {
            await runSubmit(() => updatePost(id as string, fd as unknown as Record<string, unknown>));
            // refresh the post data so view mode shows updated content
            try {
                await run(() => getPost(id as string));
            } catch {
                /* ignore - view will reload fallback */
            }
            navigate(`/news/${id}`);
        } catch (err: unknown) {
            // map server validation details to form fields when available
            const maybe = err as { details?: unknown } | undefined;
            const details = maybe?.details;
            if (details && typeof details === "object") {
                // expected shape: { missing?: { field: string, message?: string }[] }
                const missing = (details as Record<string, unknown>).missing as Array<{ field: string; message?: string }> | undefined;
                if (Array.isArray(missing)) {
                    missing.forEach((m) => {
                        if (m && typeof m.field === "string") {
                            // set field error
                            setFieldError(m.field as keyof UpdatePostForm, {
                                type: "server",
                                message: m.message ?? "Ogiltigt värde",
                            });
                        }
                    });
                }
            }
            // other errors handled by useFetch -> useError
        }
    }

    return (
        <div className="flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full mx-auto p-6">
                <div className="flex items-center justify-between">
                    <Link to="/news" className="text-sm text-green-600 underline">
                        ← Tillbaka till nyheter
                    </Link>
                    {canEdit && post && !isEditRoute && (
                        <Link
                            to={`/news/${post.id}/edit`}
                            className="text-sm text-white bg-green-600 px-3 py-1 rounded"
                        >
                            Edit
                        </Link>
                    )}
                </div>
                {loading && <Spinner />}
                {notFound ? (
                    <NotFound />
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : null}

                {post && !isEditRoute && (
                    <>
                        <h1 className="text-2xl font-bold mt-4 mb-2">{post.title}</h1>
                        {post.pictureUrl && (
                            <img
                                src={`${import.meta.env.VITE_BACKEND_URL}${post.pictureUrl}`}
                                alt={post.title}
                                className="w-full h-64 object-cover rounded mb-4"
                            />
                        )}
                        <div className="prose">
                            <p>{post.description}</p>
                        </div>
                    </>
                )}

                {post && isEditRoute && canEdit && (
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded shadow">
                        <div className="mb-4">
                            <label className="block font-medium mb-1">Titel</label>
                            <input
                                {...register("title")}
                                className="w-full border rounded px-3 py-2"
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                        </div>

                        <div className="mb-4">
                            <label className="block font-medium mb-1">Beskrivning</label>
                            <textarea
                                {...register("description")}
                                rows={6}
                                className="w-full border rounded px-3 py-2"
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                            )}
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
                            {(submitting || loading) && <Spinner />}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};