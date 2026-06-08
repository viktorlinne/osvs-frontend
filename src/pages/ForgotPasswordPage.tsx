import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button, PageContainer, errorTextClass, inputClass } from "../components";
import useError from "../context/useError";
import { forgotPassword } from "../services/auth";
import { applyApiFieldErrors, getApiErrorMessage } from "../utils/apiErrors";

type ForgotPasswordFormValues = {
  email: string;
};

export const ForgotPasswordPage = () => {
  const { setError, clearError } = useError();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    clearErrors,
    setError: setFieldError,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    clearErrors();
    setSubmitting(true);

    try {
      await forgotPassword(values.email.trim());
      setSubmitted(true);
    } catch (error: unknown) {
      if (applyApiFieldErrors(error, setFieldError)) return;
      setError(getApiErrorMessage(error) ?? "Kunde inte skicka återställningsmejlet");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <PageContainer
      size="md"
      className="ui-page flex min-h-full items-center justify-center"
    >
      <div className="ui-card w-full max-w-md">
        <p className="ui-chapter mb-3">Ordensamfundet VS</p>
        <h2 className="ui-section-title mb-3">Glömt lösenord</h2>
        <p className="mb-5 text-sm text-neutral-600">
          Ange din e-postadress så skickar vi en länk där du kan välja ett nytt
          lösenord.
        </p>

        {submitted ? (
          <div className="space-y-4">
            <p
              role="status"
              className="rounded-md border border-success-600/20 bg-success-50 px-4 py-3 text-sm text-success-700"
            >
              Om e-postadressen finns registrerad skickar vi ett mejl med en länk
              för att välja ett nytt lösenord.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/login" className="ui-btn ui-btn-primary">
                Till inloggning
              </Link>
              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                onClick={() => {
                  clearError();
                  setSubmitted(false);
                }}
              >
                Skicka igen
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="ui-label">
                E-post <span aria-hidden="true" className="text-danger-600">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={inputClass}
                {...register("email", {
                  validate: {
                    required: (value) =>
                      value.trim().length > 0 || "E-post är obligatoriskt",
                    email: (value) =>
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ||
                      "Ogiltig e-postadress",
                  },
                })}
              />
              {errors.email ? (
                <p className={errorTextClass}>{errors.email.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Skickar..." : "Skicka länk"}
              </Button>
              <Link to="/login" className="ui-btn ui-btn-secondary">
                Tillbaka
              </Link>
            </div>
          </form>
        )}
      </div>
    </PageContainer>
  );
};
