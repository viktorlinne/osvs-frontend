import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
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
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import { normalizeLodgeIds } from "../components/lodgeSelectionUtils";
import { deletePost, getPost, listLodges, updatePost } from "../services";
import type { Lodge, Post, UpdatePostForm } from "../types";
import { applyApiFieldErrors, getApiErrorMessage } from "../utils/apiErrors";
import {
  postFormRules,
  validateOptionalPostImage,
} from "../utils/formValidation";

export const PostDetail = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { data: post, run } = useFetch<Post | null>();
  const { run: runSubmit, loading: submitting } = useFetch<unknown>();
  const navigate = useNavigate();
  const location = useLocation();

  const canEdit = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );
  const isAdmin = Boolean(
    user && (user.roles ?? []).some((r) => r === "Admin"),
  );
  const isEditRoute = location.pathname.endsWith("/edit");

  const [picture, setPicture] = useState<File | null>(null);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [lodgesLoading, setLodgesLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    reset,
    trigger,
    clearErrors,
    setValue,
    control,
    formState: { errors, isValid },
  } = useForm<UpdatePostForm>({
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      lodgeIds: [],
      publicum: false,
    },
  });
  const watchedLodges = useWatch({ control, name: "lodgeIds" }) ?? [];
  const pictureError = validateOptionalPostImage(picture);

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
        if (mounted) setGlobalError("Misslyckades att hämta loger");
      })
      .finally(() => {
        if (mounted) setLodgesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [setGlobalError]);

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
            lodgeIds: (normalized.lodges ?? []).map((l) => String(l.id)),
            publicum: Boolean(normalized.publicum),
          });
          void trigger();
        }
      } catch {
        /* handled by useFetch */
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, clearGlobalError, setGlobalError, run, reset, trigger]);

  async function onSubmit(values: UpdatePostForm) {
    clearGlobalError();
    clearErrors();
    if (pictureError) return;

    const fd = new FormData();
    if (values.title && String(values.title).trim())
      fd.append("title", String(values.title).trim());
    if (values.description && String(values.description).trim())
      fd.append("description", String(values.description).trim());
    fd.append("publicum", values.publicum ? "1" : "0");
    if (picture) fd.append("picture", picture);
    const selectedLodges = normalizeLodgeIds(values.lodgeIds);
    if (selectedLodges.length === 0) {
      fd.append("lodgeIds", "");
    } else {
      selectedLodges.forEach((idValue) => fd.append("lodgeIds", idValue));
    }

    try {
      await runSubmit(() =>
        updatePost(id as string, fd as unknown as Record<string, unknown>),
      );
      try {
        await run(() => getPost(id as string));
      } catch {
        /* ignore - view will reload fallback */
      }
      navigate(`/posts/${id}`);
    } catch (error: unknown) {
      if (applyApiFieldErrors(error, setFieldError)) {
        return;
      }

      setGlobalError(
        getApiErrorMessage(error) ?? "Misslyckades att spara inlägget",
      );
    }
  }

  async function handleDeletePost() {
    if (!id || !isAdmin) return;

    const confirmed = window.confirm(
      "Är du säker på att du vill radera inlägget?",
    );
    if (!confirmed) return;

    try {
      await runSubmit(() => deletePost(id));
      navigate("/posts");
    } catch {
      setGlobalError("Misslyckades att radera inlägget");
    }
  }

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Link to=".." relative="path" className="ui-link">
          ← Tillbaka
        </Link>
        {canEdit && post && !isEditRoute && (
          <Button className="ui-btn-primary">
            <Link to={`/posts/${post.id}/edit`}>Redigera</Link>
          </Button>
        )}
      </div>

      {post && !isEditRoute && (
        <div className="ui-card grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <img
              src={
                post.pictureUrl ??
                "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/posts/postPlaceholder.png"
              }
              alt={post.title}
              className="h-64 w-full rounded-md object-cover md:h-full"
            />
          </div>
          <div className="md:col-span-2">
            <h1 className="ui-section-title mb-2">{post.title}</h1>
            <p className="text-neutral-700">{post.description}</p>
          </div>
        </div>
      )}

      {post && isEditRoute && canEdit && (
        <form onSubmit={handleSubmit(onSubmit)} className="ui-card">
          <div className="mb-4">
            <label htmlFor="title" className={labelClass}>
              Titel
            </label>
            <input
              id="title"
              {...register("title", postFormRules.title)}
              className={inputClass}
            />
            {errors.title && <p className={errorTextClass}>{errors.title.message}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="description" className={labelClass}>
              Beskrivning
            </label>
            <textarea
              id="description"
              {...register("description", postFormRules.description)}
              rows={6}
              className={textareaClass}
            />
            {errors.description && (
              <p className={errorTextClass}>{errors.description.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="picture" className={labelClass}>
              Bild
            </label>
            <input
              id="picture"
              name="picture"
              type="file"
              accept="image/*"
              className={inputClass}
              onChange={(e) =>
                setPicture(e.target.files ? e.target.files[0] : null)
              }
            />
            {pictureError ? <p className={errorTextClass}>{pictureError}</p> : null}
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
            onChange={(ids) =>
              setValue("lodgeIds", ids, { shouldDirty: true, shouldValidate: true })
            }
            disabled={submitting || lodgesLoading}
            loading={lodgesLoading}
            label="Koppla loger"
            name="edit-lodge-selection"
          />

          <div className="flex flex-col gap-2 py-2 sm:flex-row">
            <Button
              type="submit"
              className="ui-btn-primary"
              disabled={
                submitting || lodgesLoading || !isValid || Boolean(pictureError)
              }
            >
              {submitting ? "Sparar..." : "Spara"}
            </Button>
            {isAdmin && (
              <Button
                type="button"
                className="ui-btn-danger"
                onClick={handleDeletePost}
                disabled={submitting}
              >
                Radera
              </Button>
            )}
            <Button className="ui-btn-secondary">
              <Link to=".." relative="path">
                Avbryt
              </Link>
            </Button>
          </div>
        </form>
      )}
    </PageContainer>
  );
};
