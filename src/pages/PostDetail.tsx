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
import type { PostMutationResult } from "../services/posts";
import type { Lodge, Post, UpdatePostForm } from "../types";
import { applyApiFieldErrors, getApiErrorMessage } from "../utils/apiErrors";
import {
  postFormRules,
  validateOptionalPostImage,
} from "../utils/formValidation";
import { mediaPlaceholderUrl } from "../utils/media";

export const PostDetail = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { data: post, loading: postLoading, notFound: postNotFound, run } = useFetch<Post | null>();
  const { run: runSubmit, loading: submitting } = useFetch<PostMutationResult>();
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
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        setLodges(res);
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
      await runSubmit(() => updatePost(id as string, fd));
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

  async function handleConfirmDelete() {
    if (!id || !isAdmin) return;
    try {
      await runSubmit(() => deletePost(id));
      navigate("/posts");
    } catch {
      setConfirmDelete(false);
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
          <Link to={`/posts/${post.id}/edit`} className="ui-btn ui-btn-primary">
            Redigera
          </Link>
        )}
      </div>

      {postLoading && (
        <div className="ui-card grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="h-64 w-full rounded-md skeleton-shimmer md:h-full md:min-h-48" />
          </div>
          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="h-7 w-2/3 rounded skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded skeleton-shimmer" />
              <div className="h-4 w-5/6 rounded skeleton-shimmer" />
              <div className="h-4 w-4/5 rounded skeleton-shimmer" />
            </div>
            <div className="mt-auto flex gap-2 pt-2 border-t border-neutral-100">
              <div className="h-5 w-16 rounded skeleton-shimmer" />
              <div className="h-5 w-20 rounded skeleton-shimmer" />
            </div>
          </div>
        </div>
      )}

      {!postLoading && postNotFound && (
        <div className="ui-card flex flex-col items-center gap-3 py-10 text-center">
          <h1 className="ui-page-title">Inlägget hittades inte</h1>
          <p className="text-neutral-600 text-sm">
            Kontrollera länken eller gå tillbaka till inläggslistan.
          </p>
          <Link to="/posts" className="ui-btn ui-btn-primary mt-2">
            Till inläggslistan
          </Link>
        </div>
      )}

      {post && !isEditRoute && (
        <div className="ui-card animate-step-in grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <img
              src={post.pictureUrl ?? mediaPlaceholderUrl("post")}
              alt={post.title}
              className="h-64 w-full rounded-md object-cover md:h-full md:min-h-48"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-3">
            <h1 className="ui-section-title">{post.title}</h1>
            <p className="text-neutral-900">{post.description}</p>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
              {post.publicum ? (
                <span className="ui-chapter rounded px-2 py-0.5 bg-primary-50 text-primary-700">
                  Publicum
                </span>
              ) : (
                <span className="ui-chapter rounded px-2 py-0.5 bg-neutral-100 text-neutral-600">
                  Logeexklusivt
                </span>
              )}
              {(post.lodges ?? []).map((lodge) => (
                <span
                  key={lodge.id}
                  className="ui-chapter rounded px-2 py-0.5 bg-neutral-100 text-neutral-600"
                >
                  {lodge.name}
                </span>
              ))}
            </div>
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
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            />
            <label htmlFor="publicum" className={labelClass}>
              Publicum (synligt utanför logen)
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

          <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center">
            <Button
              type="submit"
              className="ui-btn-primary"
              disabled={
                submitting || lodgesLoading || !isValid || Boolean(pictureError)
              }
            >
              {submitting && !confirmDelete ? "Sparar..." : "Spara"}
            </Button>
            <Link to=".." relative="path" className="ui-btn ui-btn-secondary">
              Avbryt
            </Link>
            {isAdmin && !confirmDelete && (
              <Button
                type="button"
                className="ui-btn-danger sm:ml-auto"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting}
              >
                Radera
              </Button>
            )}
            {isAdmin && confirmDelete && (
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-sm text-danger-700">Radera permanent?</span>
                <Button
                  type="button"
                  className="ui-btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                >
                  {submitting ? "Raderar..." : "Ja"}
                </Button>
                <Button
                  type="button"
                  className="ui-btn-secondary"
                  onClick={() => setConfirmDelete(false)}
                  disabled={submitting}
                >
                  Nej
                </Button>
              </div>
            )}
          </div>
        </form>
      )}
    </PageContainer>
  );
};
