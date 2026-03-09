import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import {
  Button,
  LodgeSelection,
  PageContainer,
  errorTextClass,
  inputClass,
  labelClass,
  textareaClass,
} from "../components";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";
import { normalizeLodgeIds } from "../components/lodgeSelectionUtils";
import { createPost, listLodges } from "../services";
import type { CreatePostForm, Lodge } from "../types";

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
    defaultValues: {
      title: "",
      description: "",
      lodgeIds: [],
      publicum: false,
    },
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
    fd.append("publicum", values.publicum ? "1" : "0");
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
    }
  }

  return (
    <PageContainer size="xl" className="ui-page">
      <Link to=".." relative="path" className="ui-link">
        ← Tillbaka
      </Link>
      <h2 className="ui-page-title mb-4 mt-4">Skapa inlägg</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="ui-card">
        <div className="mb-4">
          <label htmlFor="title" className={labelClass}>
            Titel
          </label>
          <input id="title" {...register("title")} className={inputClass} />
          {errors.title && (
            <div className={errorTextClass}>{errors.title?.message}</div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="description" className={labelClass}>
            Beskrivning
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={6}
            className={textareaClass}
          />
          {errors.description && (
            <div className={errorTextClass}>{errors.description?.message}</div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="picture" className={labelClass}>
            Bild (valfritt)
          </label>
          <input
            id="picture"
            type="file"
            accept="image/*"
            className={inputClass}
            onChange={(e) =>
              setPicture(e.target.files ? e.target.files[0] : null)
            }
          />
        </div>

        <div className="mb-4 flex items-center gap-3">
          <input
            id="publicum"
            type="checkbox"
            {...register("publicum")}
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
          />
          <label
            htmlFor="publicum"
            className="text-sm font-medium text-neutral-700"
          >
            Publicum
          </label>
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

        <div className="flex flex-col gap-2 py-2 sm:flex-row">
          <Button type="submit" className="ui-btn-primary" disabled={loading}>
            Skapa
          </Button>
          <Button className="ui-btn ui-btn-secondary">
            <Link to=".." relative="path">
              Avbryt
            </Link>
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};
