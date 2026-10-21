import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useError } from "../../context";
import {
  createMailing,
  getMailing,
  getMailingPreview,
  listGroupMailings,
} from "../../services/mailings";
import type { MailingDetail, MailingPreview, MailingSummary } from "../../types";
import { applyApiFieldErrors, getApiErrorMessage } from "../../utils/apiErrors";
import {
  MAILING_BODY_MAX_LENGTH,
  MAILING_STATUS_LABEL,
  MAILING_STATUS_TONE,
  MAILING_SUBJECT_MAX_LENGTH,
  RECIPIENT_STATUS_LABEL,
  RECIPIENT_STATUS_TONE,
  formatConfirmQuestion,
  formatMailingCounts,
  formatMailingDate,
  formatPreviewSummary,
  formatRecipientCount,
  formatSkippedReasons,
  isMailingInProgress,
  validateMailingBody,
  validateMailingSubject,
} from "../../utils/mailings";
import { AsyncState } from "../AsyncState";
import { Badge } from "../shadcn/badge";
import { Button, ConfirmDialog, errorTextClass, inputClass, labelClass, textareaClass } from "../ui";
import { SkeletonBlock } from "../PageSkeleton";

/** How often the history refreshes while a mailing is queued or sending. */
export const MAILING_REFRESH_MS = 5000;

type MailingFormValues = {
  subject: string;
  body: string;
};

type GroupMailingSectionProps = {
  groupId: string;
  /** Changes when the member list changes, so the preview is refetched. */
  membersVersion: number;
};

function MailingRecipients({ mailing }: { mailing: MailingDetail }) {
  return (
    <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 text-sm">
      {mailing.recipients.map((recipient) => (
        <li key={recipient.id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
          <span className="min-w-0">
            <span className="font-medium text-neutral-900">
              {recipient.name ?? (recipient.uid ? `#${recipient.uid}` : "Borttagen medlem")}
            </span>
            {recipient.email ? (
              <span className="ml-2 break-all text-neutral-600">{recipient.email}</span>
            ) : null}
          </span>
          <span
            className={`flex flex-wrap items-baseline gap-x-2 ${
              recipient.status === "failed" ? "text-danger-700" : "text-neutral-700"
            }`}
          >
            <Badge variant={RECIPIENT_STATUS_TONE[recipient.status]}>
              {RECIPIENT_STATUS_LABEL[recipient.status]}
            </Badge>
            {recipient.reason ? <span>{recipient.reason}</span> : null}
            {recipient.status === "failed" && recipient.lastError ? (
              <span>{recipient.lastError}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function GroupMailingSection({ groupId, membersVersion }: GroupMailingSectionProps) {
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();

  const [preview, setPreview] = useState<MailingPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);

  const [mailings, setMailings] = useState<MailingSummary[] | null>(null);
  const [mailingsLoading, setMailingsLoading] = useState(true);
  const [mailingsError, setMailingsError] = useState(false);

  const [pendingValues, setPendingValues] = useState<MailingFormValues | null>(null);
  const [sending, setSending] = useState(false);

  const [openMailingId, setOpenMailingId] = useState<number | null>(null);
  const [openMailing, setOpenMailing] = useState<MailingDetail | null>(null);
  const [openMailingError, setOpenMailingError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setError: setFieldError,
    formState: { errors },
  } = useForm<MailingFormValues>({
    mode: "onSubmit",
    defaultValues: { subject: "", body: "" },
  });

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(false);
    try {
      setPreview(await getMailingPreview(groupId));
    } catch {
      setPreviewError(true);
    } finally {
      setPreviewLoading(false);
    }
  }, [groupId]);

  const loadMailings = useCallback(
    async (silent = false) => {
      if (!silent) {
        setMailingsLoading(true);
        setMailingsError(false);
      }
      try {
        setMailings(await listGroupMailings(groupId));
        setMailingsError(false);
      } catch {
        if (!silent) setMailingsError(true);
      } finally {
        if (!silent) setMailingsLoading(false);
      }
    },
    [groupId],
  );

  const loadOpenMailing = useCallback(async (id: number) => {
    setOpenMailingError(false);
    try {
      setOpenMailing(await getMailing(id));
    } catch {
      setOpenMailingError(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadPreview(), 0);
    return () => clearTimeout(timer);
  }, [loadPreview, membersVersion]);

  useEffect(() => {
    const timer = setTimeout(() => void loadMailings(), 0);
    return () => clearTimeout(timer);
  }, [loadMailings]);

  // Auto-refresh while something is queued or being sent.
  const inProgress = (mailings ?? []).some((mailing) => isMailingInProgress(mailing.status));
  const openMailingIdRef = useRef(openMailingId);
  openMailingIdRef.current = openMailingId;
  useEffect(() => {
    if (!inProgress) return;
    const interval = setInterval(() => {
      void loadMailings(true);
      if (openMailingIdRef.current !== null) void loadOpenMailing(openMailingIdRef.current);
    }, MAILING_REFRESH_MS);
    return () => clearInterval(interval);
  }, [inProgress, loadMailings, loadOpenMailing]);

  function requestConfirm(values: MailingFormValues) {
    clearGlobalError();
    setPendingValues(values);
  }

  async function confirmSend() {
    if (!pendingValues) return;
    clearGlobalError();
    clearErrors();
    setSending(true);
    try {
      const created = await createMailing(groupId, {
        subject: pendingValues.subject.trim(),
        body: pendingValues.body.trim(),
      });
      reset({ subject: "", body: "" });
      setPendingValues(null);
      const skippedText = created.skipped > 0 ? `, ${created.skipped} hoppas över` : "";
      toast.success(
        `Utskicket har lagts i kö till ${formatRecipientCount(created.queued)}${skippedText}.`,
      );
      await loadMailings(true);
    } catch (error: unknown) {
      setPendingValues(null);
      if (applyApiFieldErrors(error, setFieldError)) return;
      setGlobalError(getApiErrorMessage(error) ?? "Kunde inte skicka utskicket");
    } finally {
      setSending(false);
    }
  }

  function toggleMailing(id: number) {
    if (openMailingId === id) {
      setOpenMailingId(null);
      setOpenMailing(null);
      return;
    }
    setOpenMailingId(id);
    setOpenMailing(null);
    void loadOpenMailing(id);
  }

  const recipients = preview?.recipients ?? 0;
  const noRecipients = preview !== null && recipients === 0;
  const skippedText = preview ? formatSkippedReasons(preview.skippedByReason) : "";

  return (
    <>
      <section className="mb-8" aria-labelledby="mailing-heading">
        <h2 id="mailing-heading" className="mb-3 text-lg font-semibold text-neutral-900">
          Skicka utskick
        </h2>
        <form onSubmit={handleSubmit(requestConfirm)} className="ui-card" noValidate>
          <div className="mb-4">
            <label htmlFor="mailing-subject" className={labelClass}>
              Ämne
            </label>
            <input
              id="mailing-subject"
              autoComplete="off"
              maxLength={MAILING_SUBJECT_MAX_LENGTH}
              className={inputClass}
              disabled={sending || pendingValues !== null}
              aria-invalid={errors.subject ? true : undefined}
              {...register("subject", { validate: validateMailingSubject })}
            />
            {errors.subject?.message ? (
              <p className={errorTextClass}>{errors.subject.message}</p>
            ) : null}
          </div>

          <div className="mb-4">
            <label htmlFor="mailing-body" className={labelClass}>
              Meddelande
            </label>
            <textarea
              id="mailing-body"
              rows={8}
              maxLength={MAILING_BODY_MAX_LENGTH}
              className={textareaClass}
              disabled={sending || pendingValues !== null}
              aria-invalid={errors.body ? true : undefined}
              {...register("body", { validate: validateMailingBody })}
            />
            {errors.body?.message ? (
              <p className={errorTextClass}>{errors.body.message}</p>
            ) : null}
            <p className="mt-1 text-xs text-neutral-500">
              Skickas som vanlig text från OSVS. Svar går till din e-postadress.
            </p>
          </div>

          <div className="mb-4 text-sm text-neutral-700" aria-live="polite">
            {previewLoading && !preview ? (
              <div>
                <span className="sr-only">Räknar mottagare…</span>
                <SkeletonBlock className="h-4 w-2/3" />
              </div>
            ) : previewError ? (
              <AsyncState
                loading={false}
                error
                errorMessage="Mottagarna kunde inte räknas."
                onRetry={() => void loadPreview()}
              />
            ) : preview ? (
              <>
                <p data-testid="mailing-preview">
                  {formatPreviewSummary(preview.recipients, preview.skipped)}
                  {preview.recipients > 0 && skippedText ? ` ${skippedText}.` : null}
                </p>
                {preview.devAllowlist.active ? (
                  <p className="mt-1 text-xs text-neutral-500">
                    Utvecklingsläge: bara adresser i MAIL_DEV_ALLOWLIST får e-post
                    {preview.devAllowlist.blocked > 0
                      ? ` (${preview.devAllowlist.blocked} av mottagarna hoppas över).`
                      : "."}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={previewLoading || previewError || noRecipients || pendingValues !== null}
          >
            Skicka utskick
          </Button>
          <ConfirmDialog
            open={pendingValues !== null}
            onOpenChange={(open) => {
              if (!open) setPendingValues(null);
            }}
            title={formatConfirmQuestion(recipients)}
            description={
              pendingValues
                ? `Ämne: ${pendingValues.subject.trim()}`
                : undefined
            }
            variant="primary"
            confirmLabel="Ja, skicka"
            pendingLabel="Skickar…"
            pending={sending}
            onConfirm={() => void confirmSend()}
          />
        </form>
      </section>

      <section className="mb-8" aria-labelledby="mailings-heading">
        <h2 id="mailings-heading" className="mb-3 text-lg font-semibold text-neutral-900">
          Tidigare utskick
        </h2>
        <AsyncState
          loading={mailingsLoading && !mailings}
          error={mailingsError}
          errorMessage="Utskicken kunde inte laddas."
          onRetry={() => void loadMailings()}
          empty={(mailings ?? []).length === 0}
          emptyMessage={
            <p className="rounded-card border border-neutral-200 px-5 py-4 text-sm text-neutral-600">
              Inga utskick har skickats till gruppen ännu.
            </p>
          }
          loadingFallback={
            <div
              className="overflow-hidden rounded-card border border-neutral-200"
              aria-busy="true"
              aria-label="Laddar utskick"
            >
              {[0, 1].map((i) => (
                <div key={i} className="border-b border-neutral-200 px-5 py-3.5 last:border-b-0" aria-hidden="true">
                  <SkeletonBlock className="h-5 w-1/2" />
                </div>
              ))}
            </div>
          }
        >
          <ul className="overflow-hidden rounded-card border border-neutral-200">
            {(mailings ?? []).map((mailing) => {
              const open = openMailingId === mailing.id;
              return (
                <li
                  key={mailing.id}
                  className="border-b border-neutral-200 bg-white px-5 py-3 last:border-b-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold break-words text-neutral-900">{mailing.subject}</p>
                      <p className="text-sm text-neutral-600">
                        {formatMailingDate(mailing.createdAt)}
                        {mailing.senderName || mailing.senderEmail
                          ? ` · ${mailing.senderName ?? mailing.senderEmail}`
                          : null}
                      </p>
                      <p className="mt-1 text-sm text-neutral-700">
                        <Badge variant={MAILING_STATUS_TONE[mailing.status]} className="mr-2">
                          {MAILING_STATUS_LABEL[mailing.status]}
                        </Badge>
                        {formatMailingCounts(mailing.counts)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      aria-expanded={open}
                      onClick={() => toggleMailing(mailing.id)}
                    >
                      {open ? "Dölj mottagare" : "Visa mottagare"}
                    </Button>
                  </div>
                  {open ? (
                    openMailingError ? (
                      <div className="mt-3">
                        <AsyncState
                          loading={false}
                          error
                          errorMessage="Mottagarna kunde inte laddas."
                          onRetry={() => void loadOpenMailing(mailing.id)}
                        />
                      </div>
                    ) : openMailing ? (
                      <MailingRecipients mailing={openMailing} />
                    ) : (
                      <div role="status" className="mt-3">
                        <span className="sr-only">Laddar mottagare…</span>
                        <SkeletonBlock className="h-4 w-1/2" />
                      </div>
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
        </AsyncState>
      </section>
    </>
  );
}

export default GroupMailingSection;
