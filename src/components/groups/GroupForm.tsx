import { useForm } from "react-hook-form";
import { useError } from "../../context";
import type { GroupInput } from "../../types";
import { applyApiFieldErrors, getApiErrorMessage } from "../../utils/apiErrors";
import { Button, errorTextClass, inputClass, labelClass, textareaClass } from "../ui";

export const GROUP_NAME_MAX_LENGTH = 255;
export const GROUP_DESCRIPTION_MAX_LENGTH = 2000;

type GroupFormValues = {
  name: string;
  description: string;
};

type GroupFormProps = {
  idPrefix: string;
  initialValues?: { name: string; description?: string | null };
  submitLabel: string;
  submittingLabel: string;
  fallbackErrorMessage: string;
  onSubmit: (values: GroupInput) => Promise<void>;
  onCancel?: () => void;
};

export function GroupForm({
  idPrefix,
  initialValues,
  submitLabel,
  submittingLabel,
  fallbackErrorMessage,
  onSubmit,
  onCancel,
}: GroupFormProps) {
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const {
    register,
    handleSubmit,
    clearErrors,
    setError: setFieldError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<GroupFormValues>({
    mode: "onChange",
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
    },
  });

  async function submit(values: GroupFormValues) {
    clearGlobalError();
    clearErrors();
    const description = values.description.trim();
    try {
      await onSubmit({
        name: values.name.trim(),
        description: description.length > 0 ? description : null,
      });
    } catch (error: unknown) {
      if (applyApiFieldErrors(error, setFieldError)) return;
      setGlobalError(getApiErrorMessage(error) ?? fallbackErrorMessage);
    }
  }

  const nameId = `${idPrefix}-name`;
  const descriptionId = `${idPrefix}-description`;

  return (
    <form onSubmit={handleSubmit(submit)} className="ui-card" noValidate>
      <div className="mb-4">
        <label htmlFor={nameId} className={labelClass}>
          Namn
        </label>
        <input
          id={nameId}
          autoComplete="off"
          className={inputClass}
          aria-invalid={errors.name ? true : undefined}
          {...register("name", {
            validate: (value) => {
              const trimmed = value.trim();
              if (!trimmed) return "Namn är obligatoriskt";
              if (trimmed.length > GROUP_NAME_MAX_LENGTH) {
                return `Namnet får vara högst ${GROUP_NAME_MAX_LENGTH} tecken`;
              }
              return true;
            },
          })}
        />
        {errors.name?.message ? (
          <p className={errorTextClass}>{errors.name.message}</p>
        ) : null}
      </div>

      <div className="mb-4">
        <label htmlFor={descriptionId} className={labelClass}>
          Beskrivning (valfri)
        </label>
        <textarea
          id={descriptionId}
          rows={3}
          className={textareaClass}
          aria-invalid={errors.description ? true : undefined}
          {...register("description", {
            validate: (value) =>
              value.trim().length <= GROUP_DESCRIPTION_MAX_LENGTH ||
              `Beskrivningen får vara högst ${GROUP_DESCRIPTION_MAX_LENGTH} tecken`,
          })}
        />
        {errors.description?.message ? (
          <p className={errorTextClass}>{errors.description.message}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={isSubmitting} disabled={!isValid}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Avbryt
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export default GroupForm;
