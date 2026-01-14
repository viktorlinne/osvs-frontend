import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context";
import { getPost, updatePost } from "../services";
import { Spinner } from "../components";
import type { Post } from "../types";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";
import { useForm } from "react-hook-form";
import type { UpdatePostForm } from "../types";

export const PostDetail = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const {
    setError: setGlobalError,
    clearError: clearGlobalError,
  } = useError();
  const { data: post, loading, run } = useFetch<Post | null>();
  const { run: runSubmit, loading: submitting } = useFetch<{
    success: boolean;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const canEdit = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r))
  );
  const isEditRoute = location.pathname.endsWith("/edit");

  const [picture, setPicture] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    reset,
    formState: { errors },
  } = useForm<UpdatePostForm>({
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
          reset({
            title: normalized.title ?? "",
            description: normalized.description ?? "",
          });
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
    if (values.title && String(values.title).trim())
      fd.append("title", String(values.title).trim());
    if (values.description && String(values.description).trim())
      fd.append("description", String(values.description).trim());
    if (picture) fd.append("picture", picture);

    try {
      await runSubmit(() =>
        updatePost(id as string, fd as unknown as Record<string, unknown>)
      );
      // refresh the post data so view mode shows updated content
      try {
        await run(() => getPost(id as string));
      } catch {
        /* ignore - view will reload fallback */
      }
      navigate(`/posts/${id}`);
    } catch (err: unknown) {
      // map server validation details to form fields when available
      const maybe = err as { details?: unknown } | undefined;
      const details = maybe?.details;
      if (details && typeof details === "object") {
        // expected shape: { missing?: { field: string, message?: string }[] }
        const missing = (details as Record<string, unknown>).missing as
          | Array<{ field: string; message?: string }>
          | undefined;
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
    }
  }


  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner /></div>;

  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="max-w-3xl w-full mx-auto p-6">
        <div className="flex items-center justify-between">
          <Link to=".." relative="path" className="text-sm text-green-600 underline mb-2">← Tillbaka</Link>
          {canEdit && post && !isEditRoute && (
            <Link
              to={`/posts/${post.id}/edit`}
              className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md"
            >
              Redigera
            </Link>
          )}
        </div>
        {post && !isEditRoute && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <img
                src={post.pictureUrl ?? "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/posts/postPlaceholder.png"}
                alt={post.title}
                className="w-full h-64 md:h-full object-cover rounded"
              />
            </div>
            <div className="md:col-span-2">
              <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
              <div className="prose">
                <p>{post.description}</p>
              </div>
            </div>
          </div>
        )}

        {post && isEditRoute && canEdit && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-4 rounded shadow"
          >
            <div className="mb-4">
              <label htmlFor="title" className="block font-medium mb-1">Titel</label>
              <input
                id="title"
                {...register("title")}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block font-medium mb-1">Beskrivning</label>
              <textarea
                id="description"
                {...register("description")}
                rows={6}
                className="w-full border rounded px-3 py-2"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="picture" className="block font-medium mb-1">Bild (valfritt)</label>
              <input
                id="picture"
                name="picture"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setPicture(e.target.files ? e.target.files[0] : null)
                }
              />
            </div>

            <div className="flex items-center gap-x-4 py-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-sm font-medium transition text-white px-4 py-2 rounded disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Sparar..." : "Spara"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
