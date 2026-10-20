import { useId, useState, type FormEvent } from "react";
import { Button } from "../ui";
import { getApiErrorMessage, getApiFieldErrors } from "../../utils/apiErrors";
import type {
  AchievementEntryPayload,
  OfficialEntryPayload,
} from "../../services/memberHistory";

const NOTE_MAX_LENGTH = 1000;

type Option = { id: number; title: string };
type FieldErrors = Record<string, string>;

function useSubmitState() {
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(action: () => Promise<void>, fallback: string) {
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      await action();
    } catch (error: unknown) {
      const fields = getApiFieldErrors(error);
      if (fields) {
        setFieldErrors(fields);
      } else {
        setFormError(getApiErrorMessage(error) ?? fallback);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, fieldErrors, formError, submit };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="ui-error">
      {message}
    </p>
  );
}

function FormErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-danger-600/30 bg-danger-600/5 px-3 py-2 text-sm text-danger-600"
    >
      {message}
    </p>
  );
}

function NoteField({
  value,
  onChange,
  required,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  required: boolean;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="ui-label">
        Anteckning{required ? " (obligatorisk)" : " (valfri)"}
      </label>
      <textarea
        id={id}
        name="note"
        rows={3}
        maxLength={NOTE_MAX_LENGTH}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
        placeholder={
          required ? "Beskriv varför uppgiften ändras" : "Valfri kommentar"
        }
        className="ui-textarea"
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function DialogActions({
  submitLabel,
  submitting,
  disabled,
  onCancel,
  variant = "primary",
}: {
  submitLabel: string;
  submitting: boolean;
  disabled: boolean;
  onCancel: () => void;
  variant?: "primary" | "danger";
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="secondary" onClick={onCancel}>
        Avbryt
      </Button>
      <Button
        type="submit"
        variant={variant}
        loading={submitting}
        disabled={disabled}
      >
        {submitting ? "Sparar..." : submitLabel}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tjänst
// ---------------------------------------------------------------------------

export type OfficialFormInitial = {
  officialId: number | null;
  appointedAt: string;
  unappointedAt: string | null;
};

export function OfficialEntryForm({
  mode,
  initial,
  options,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initial: OfficialFormInitial;
  options: Option[];
  onSubmit: (payload: OfficialEntryPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const [officialId, setOfficialId] = useState<number | null>(
    initial.officialId,
  );
  const [appointedAt, setAppointedAt] = useState(initial.appointedAt);
  const [unappointedAt, setUnappointedAt] = useState(
    initial.unappointedAt ?? "",
  );
  const [startConfirmed, setStartConfirmed] = useState(false);
  const [endConfirmed, setEndConfirmed] = useState(false);
  const [note, setNote] = useState("");
  const { submitting, fieldErrors, formError, submit } = useSubmitState();

  const noteRequired = mode === "edit";
  const endBeforeStart =
    Boolean(appointedAt && unappointedAt) && unappointedAt < appointedAt;
  const canSave =
    officialId !== null &&
    appointedAt.length > 0 &&
    !endBeforeStart &&
    startConfirmed &&
    endConfirmed &&
    (!noteRequired || note.trim().length > 0) &&
    !submitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || officialId === null) return;
    void submit(
      () =>
        onSubmit({
          officialId,
          appointedAt,
          unappointedAt: unappointedAt || null,
          datesConfirmed: startConfirmed && endConfirmed,
          note: note.trim() || null,
        }),
      "Kunde inte spara tjänsten",
    );
  }

  const startLabel = appointedAt
    ? `Jag bekräftar startdatumet ${appointedAt}`
    : "Jag bekräftar startdatumet";
  const endLabel = unappointedAt
    ? `Jag bekräftar slutdatumet ${unappointedAt}`
    : "Jag bekräftar att tjänsten är pågående (inget slutdatum)";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormErrorBanner message={formError} />

      <div>
        <label htmlFor={`${id}-official`} className="ui-label">
          Tjänst
        </label>
        <select
          id={`${id}-official`}
          name="officialId"
          value={officialId ?? ""}
          onChange={(e) =>
            setOfficialId(e.target.value ? Number(e.target.value) : null)
          }
          aria-invalid={Boolean(fieldErrors.officialId) || undefined}
          className="ui-select"
        >
          <option value="">Välj tjänst</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
        <FieldError id={`${id}-official-error`} message={fieldErrors.officialId} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-start`} className="ui-label">
            Startdatum
          </label>
          <input
            id={`${id}-start`}
            name="appointedAt"
            type="date"
            value={appointedAt}
            onChange={(e) => {
              setAppointedAt(e.target.value);
              setStartConfirmed(false);
            }}
            aria-invalid={Boolean(fieldErrors.appointedAt) || undefined}
            className="ui-input"
          />
          <FieldError id={`${id}-start-error`} message={fieldErrors.appointedAt} />
        </div>
        <div>
          <label htmlFor={`${id}-end`} className="ui-label">
            Slutdatum
          </label>
          <input
            id={`${id}-end`}
            name="unappointedAt"
            type="date"
            value={unappointedAt}
            onChange={(e) => {
              setUnappointedAt(e.target.value);
              setEndConfirmed(false);
            }}
            aria-invalid={
              Boolean(fieldErrors.unappointedAt || endBeforeStart) || undefined
            }
            className="ui-input"
          />
          <p className="mt-1 text-xs text-neutral-600">Tomt = pågående</p>
          <FieldError
            id={`${id}-end-error`}
            message={
              fieldErrors.unappointedAt ??
              (endBeforeStart
                ? "Slutdatum kan inte vara före startdatum"
                : undefined)
            }
          />
        </div>
      </div>

      <fieldset className="rounded-md border border-neutral-200 px-3 py-2">
        <legend className="ui-label px-1">Bekräfta datum</legend>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`${id}-confirm-start`}
            className="inline-flex items-start gap-2 text-sm text-neutral-800"
          >
            <input
              id={`${id}-confirm-start`}
              name="startConfirmed"
              type="checkbox"
              checked={startConfirmed}
              disabled={!appointedAt}
              onChange={(e) => setStartConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
            />
            <span>{startLabel}</span>
          </label>
          <label
            htmlFor={`${id}-confirm-end`}
            className="inline-flex items-start gap-2 text-sm text-neutral-800"
          >
            <input
              id={`${id}-confirm-end`}
              name="endConfirmed"
              type="checkbox"
              checked={endConfirmed}
              onChange={(e) => setEndConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
            />
            <span>{endLabel}</span>
          </label>
        </div>
        <FieldError
          id={`${id}-confirm-error`}
          message={fieldErrors.datesConfirmed}
        />
      </fieldset>

      <NoteField
        value={note}
        onChange={setNote}
        required={noteRequired}
        error={fieldErrors.note}
      />

      <DialogActions
        submitLabel="Spara"
        submitting={submitting}
        disabled={!canSave}
        onCancel={onCancel}
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Utmärkelse
// ---------------------------------------------------------------------------

export type AchievementFormInitial = {
  achievementId: number | null;
  awardedAt: string;
};

export function AchievementEntryForm({
  mode,
  initial,
  options,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initial: AchievementFormInitial;
  options: Option[];
  onSubmit: (payload: AchievementEntryPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const [achievementId, setAchievementId] = useState<number | null>(
    initial.achievementId,
  );
  const [awardedAt, setAwardedAt] = useState(initial.awardedAt);
  const [note, setNote] = useState("");
  const { submitting, fieldErrors, formError, submit } = useSubmitState();

  const noteRequired = mode === "edit";
  const canSave =
    achievementId !== null &&
    awardedAt.length > 0 &&
    (!noteRequired || note.trim().length > 0) &&
    !submitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || achievementId === null) return;
    void submit(
      () =>
        onSubmit({
          achievementId,
          awardedAt,
          note: note.trim() || null,
        }),
      "Kunde inte spara utmärkelsen",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormErrorBanner message={formError} />

      <div>
        <label htmlFor={`${id}-achievement`} className="ui-label">
          Utmärkelse
        </label>
        <select
          id={`${id}-achievement`}
          name="achievementId"
          value={achievementId ?? ""}
          onChange={(e) =>
            setAchievementId(e.target.value ? Number(e.target.value) : null)
          }
          aria-invalid={Boolean(fieldErrors.achievementId) || undefined}
          className="ui-select"
        >
          <option value="">Välj utmärkelse</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
        <FieldError
          id={`${id}-achievement-error`}
          message={fieldErrors.achievementId}
        />
      </div>

      <div>
        <label htmlFor={`${id}-date`} className="ui-label">
          Datum
        </label>
        <input
          id={`${id}-date`}
          name="awardedAt"
          type="date"
          value={awardedAt}
          onChange={(e) => setAwardedAt(e.target.value)}
          aria-invalid={Boolean(fieldErrors.awardedAt) || undefined}
          className="ui-input"
        />
        <FieldError id={`${id}-date-error`} message={fieldErrors.awardedAt} />
      </div>

      <NoteField
        value={note}
        onChange={setNote}
        required={noteRequired}
        error={fieldErrors.note}
      />

      <DialogActions
        submitLabel="Spara"
        submitting={submitting}
        disabled={!canSave}
        onCancel={onCancel}
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Ta bort
// ---------------------------------------------------------------------------

export function DeleteEntryForm({
  description,
  onSubmit,
  onCancel,
}: {
  description: string;
  onSubmit: (note: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  const { submitting, fieldErrors, formError, submit } = useSubmitState();
  const canSave = note.trim().length > 0 && !submitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    void submit(() => onSubmit(note.trim()), "Kunde inte ta bort posten");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormErrorBanner message={formError} />
      <p className="text-sm text-neutral-800">{description}</p>
      <NoteField
        value={note}
        onChange={setNote}
        required
        error={fieldErrors.note}
      />
      <DialogActions
        submitLabel="Ta bort"
        submitting={submitting}
        disabled={!canSave}
        onCancel={onCancel}
        variant="danger"
      />
    </form>
  );
}
