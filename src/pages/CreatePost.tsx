import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPost, listLodges } from "../services";
import useFetch from "../hooks/useFetch";
import LodgeSelection from "../components/LodgeSelection";
import { normalizeLodgeIds } from "../components/lodgeSelectionUtils";
import { useError } from "../context";
import type { CreatePostForm, Lodge } from "../types";
import { useForm, useWatch } from "react-hook-form";

export const CreatePost = () => {
  const { clearError: clearGlobalError, setError: setGlobalError } = useError();
  const { run, loading } = useFetch<{ success: boolean; id?: number }>();
  const navigate = useNavigate();

  const [picture, setPicture] = useState<File | null>(null);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [lodgesLoading, setLodgesLoading] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFieldError,
    setValue,
    control,
  } = useForm<CreatePostForm>({
    defaultValues: { title: "", description: "", lodgeIds: [] },
  });
  const watchedLodges = useWatch({ control, name: "lodgeIds" }) ?? [];

  useEffect(() => {
    register("lodgeIds");
  }, [register]);

  useEffect(() => {
    let mounted = true;
    listLodges()
      .then((res) => {
        if (!mounted) return;
        if (Array.isArray(res)) {
          setLodges(res);
        }
      })
      .catch(() => {
        if (mounted) {
          setGlobalError("Misslyckades att hämta loger");
        }
      })
      .finally(() => {
        if (mounted) setLodgesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [setGlobalError]);

  async function onSubmit(values: CreatePostForm) {
    clearGlobalError();
    const fd = new FormData();
    fd.append("title", values.title.trim());
    fd.append("description", String(values.description ?? "").trim());
    const selectedLodges = normalizeLodgeIds(values.lodgeIds);
    if (selectedLodges.length === 0) {
      fd.append("lodgeIds", "");
    } else {
      selectedLodges.forEach((id) => fd.append("lodgeIds", id));
    }
    if (picture) fd.append("picture", picture);

    try {
      const res = await run(() =>
        createPost(fd as unknown as Record<string, unknown>),
      );
      const id = res?.id ?? null;
      if (id) navigate(`/posts/${id}`);
      else navigate("/posts");
    } catch (e: unknown) {
      // map server-side validation errors to fields when possible
      const err = e as { status?: number; details?: unknown };
      if (
        err?.status === 400 &&
        err.details &&
        typeof err.details === "object"
      ) {
        const rec = err.details as Record<string, unknown>;
        const missing = Array.isArray(rec.missing) ? rec.missing : undefined;
        if (missing) {
          missing.forEach((p: unknown) => {
            if (typeof p === "string") {
              setFieldError(p as unknown as keyof CreatePostForm, {
                type: "server",
                message: "Ogiltigt värde",
              });
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
        <Link
          to="/posts"
          className="text-sm text-green-600 hover:text-green-700 hover:underline"
        >
          ← Tillbaka
        </Link>
        <h2 className="text-2xl font-bold mt-4 mb-4">Skapa inlägg</h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-4 rounded-md shadow"
        >
          <div className="mb-4">
            <label htmlFor="title" className="block font-medium mb-1">
              Titel
            </label>
            <input
              id="title"
              {...register("title")}
              className="w-full border rounded-md px-3 py-2"
            />
            {errors.title && (
              <div className="text-red-600 mt-1">{errors.title?.message}</div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block font-medium mb-1">
              Beskrivning
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={6}
              className="w-full border rounded-md px-3 py-2"
            />
            {errors.description && (
              <div className="text-red-600 mt-1">
                {errors.description?.message}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="picture" className="block font-medium mb-1">
              Bild (valfritt)
            </label>
            <input
              id="picture"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setPicture(e.target.files ? e.target.files[0] : null)
              }
            />
          </div>

          <LodgeSelection
            lodges={lodges}
            selectedIds={watchedLodges}
            onChange={(ids) => setValue("lodgeIds", ids, { shouldDirty: true })}
            disabled={loading || lodgesLoading}
            loading={lodgesLoading}
            label="Koppla loger"
            name="post-lodge-selection"
          />

          <div className="flex items-center gap-x-4 py-2">
            <button
              type="submit"
              className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md"
              disabled={loading}
            >
              Skapa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
