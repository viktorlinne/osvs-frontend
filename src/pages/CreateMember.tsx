import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  AllergiesManager,
  Button,
  PageContainer,
  errorTextClass,
  inputClass,
  selectClass,
  textareaClass,
} from "../components";
import useError from "../context/useError";
import useFetch from "../hooks/useFetch";
import {
  registerMember,
  type RegisterMemberResponse,
} from "../services/auth";
import { listLodges } from "../services/lodges";
import type { Lodge, RegisterForm } from "../types";
import { applyApiFieldErrors, getApiErrorMessage } from "../utils/apiErrors";
import {
  registerFormRules,
  validateImageFile,
} from "../utils/formValidation";

const STEPS = [
  "Konto",
  "Personuppgifter",
  "Kontaktuppgifter",
  "Loge & övrigt",
] as const;

type StepIndex = 0 | 1 | 2 | 3;

const STEP_FIELDS: Record<StepIndex, Array<keyof RegisterForm>> = {
  0: ["email", "password"],
  1: ["firstname", "lastname", "dateOfBirth"],
  2: ["mobile", "homeNumber", "city", "address", "zipcode"],
  3: [],
};

export const CreateMember = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepIndex>(0);
  const [loading, setLoading] = useState(false);
  const [picture, setPicture] = useState<File | null>(null);
  const [pictureTouched, setPictureTouched] = useState(false);
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[]>([]);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const { run: runLodges, loading: lodgesLoading } = useFetch<Lodge[]>();
  const { run: runSubmit } = useFetch<RegisterMemberResponse>();
  const { setError } = useError();

  const {
    register,
    handleSubmit,
    trigger,
    clearErrors,
    setError: setFieldError,
    formState: { errors },
  } = useForm<RegisterForm>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      firstname: "",
      lastname: "",
      dateOfBirth: "",
      work: "",
      notes: "",
      mobile: "",
      homeNumber: "",
      city: "",
      address: "",
      zipcode: "",
      lodgeId: "",
    },
  });

  const pictureError = pictureTouched
    ? validateImageFile(picture, { required: true })
    : null;

  async function advance() {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 || (await trigger(fields));
    if (valid) setStep((s) => (s + 1) as StepIndex);
  }

  async function onSubmit(values: RegisterForm) {
    setError(null);
    clearErrors();
    setLoading(true);

    try {
      const picErr = validateImageFile(picture, { required: true });
      if (picErr) {
        setPictureTouched(true);
        setFieldError("picture", { type: "manual", message: picErr });
        return;
      }

      const fd = new FormData();
      fd.append("email", String(values.email ?? "").trim());
      fd.append("password", String(values.password ?? ""));
      fd.append("firstname", String(values.firstname ?? "").trim());
      fd.append("lastname", String(values.lastname ?? "").trim());
      fd.append("dateOfBirth", String(values.dateOfBirth ?? ""));
      if (values.work) fd.append("work", String(values.work));
      if (values.homeNumber) {
        fd.append("homeNumber", String(values.homeNumber).trim());
      }
      fd.append("mobile", String(values.mobile ?? "").trim());
      fd.append("city", String(values.city ?? "").trim());
      fd.append("address", String(values.address ?? "").trim());
      fd.append("zipcode", String(values.zipcode ?? "").trim());
      if (values.lodgeId) fd.append("lodgeId", String(Number(values.lodgeId)));
      if (values.notes) fd.append("notes", String(values.notes).trim());
      if (selectedAllergyIds.length > 0) {
        fd.append("allergyIds", selectedAllergyIds.join(","));
      }
      if (picture) fd.append("picture", picture);

      await runSubmit(() => registerMember(fd));
      navigate("/members");
    } catch (error: unknown) {
      if (applyApiFieldErrors(error, setFieldError)) return;
      setError(getApiErrorMessage(error) ?? "Kunde inte registrera ledamoten");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runLodges(() => listLodges())
      .then((data) => setLodges(data))
      .catch(() => {});
  }, [runLodges]);

  return (
    <PageContainer size="md" className="ui-page">
      <div className="mb-4">
        <Link to=".." relative="path" className="ui-link">
          ← Tillbaka
        </Link>
      </div>

      <h2 className="ui-page-title mb-2">Registrera ledamot</h2>

      <div className="mb-6 flex items-center gap-3">
        <p className="ui-chapter">
          Steg {step + 1} av {STEPS.length}: {STEPS[step]}
        </p>
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`block h-1.5 w-6 rounded-full transition-colors duration-200 ${
                i < step
                  ? "bg-primary-600"
                  : i === step
                    ? "bg-primary-400"
                    : "bg-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="ui-card">
          <div key={step} className="animate-step-in space-y-5">

            {step === 0 && (
              <>
                <div>
                  <label htmlFor="email" className="ui-label">
                    E-post{" "}
                    <span className="text-danger-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-required="true"
                    {...register("email", registerFormRules.email)}
                    className={inputClass}
                  />
                  {errors.email && (
                    <p className={errorTextClass}>{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="ui-label">
                    Lösenord{" "}
                    <span className="text-danger-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    aria-required="true"
                    {...register("password", registerFormRules.password)}
                    className={inputClass}
                  />
                  {errors.password ? (
                    <p className={errorTextClass}>{errors.password.message}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-neutral-500">
                      Minst 6 tecken. Ledamoten kan ändra lösenordet efter inloggning.
                    </p>
                  )}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="firstname" className="ui-label">
                      Förnamn{" "}
                      <span className="text-danger-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="firstname"
                      type="text"
                      autoComplete="given-name"
                      aria-required="true"
                      {...register("firstname", registerFormRules.firstname)}
                      className={inputClass}
                    />
                    {errors.firstname && (
                      <p className={errorTextClass}>{errors.firstname.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastname" className="ui-label">
                      Efternamn{" "}
                      <span className="text-danger-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="lastname"
                      type="text"
                      autoComplete="family-name"
                      aria-required="true"
                      {...register("lastname", registerFormRules.lastname)}
                      className={inputClass}
                    />
                    {errors.lastname && (
                      <p className={errorTextClass}>{errors.lastname.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="ui-label">
                    Födelsedatum{" "}
                    <span className="text-danger-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    aria-required="true"
                    {...register("dateOfBirth", registerFormRules.dateOfBirth)}
                    className={inputClass}
                  />
                  {errors.dateOfBirth && (
                    <p className={errorTextClass}>{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="work" className="ui-label">Yrke</label>
                  <input
                    id="work"
                    type="text"
                    autoComplete="organization-title"
                    {...register("work")}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="mobile" className="ui-label">
                      Mobilnummer{" "}
                      <span className="text-danger-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="mobile"
                      type="text"
                      inputMode="tel"
                      autoComplete="tel-national"
                      aria-required="true"
                      {...register("mobile", registerFormRules.mobile)}
                      className={inputClass}
                    />
                    {errors.mobile && (
                      <p className={errorTextClass}>{errors.mobile.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="homeNumber" className="ui-label">
                      Hemnummer
                    </label>
                    <input
                      id="homeNumber"
                      type="text"
                      inputMode="tel"
                      autoComplete="tel"
                      {...register("homeNumber", registerFormRules.homeNumber)}
                      className={inputClass}
                    />
                    {errors.homeNumber && (
                      <p className={errorTextClass}>{errors.homeNumber.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="ui-label">
                    Adress{" "}
                    <span className="text-danger-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    autoComplete="street-address"
                    aria-required="true"
                    {...register("address", registerFormRules.address)}
                    className={inputClass}
                  />
                  {errors.address && (
                    <p className={errorTextClass}>{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="zipcode" className="ui-label">
                      Postnummer{" "}
                      <span className="text-danger-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="zipcode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      aria-required="true"
                      {...register("zipcode", registerFormRules.zipcode)}
                      className={inputClass}
                    />
                    {errors.zipcode && (
                      <p className={errorTextClass}>{errors.zipcode.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="city" className="ui-label">
                      Stad{" "}
                      <span className="text-danger-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      autoComplete="address-level2"
                      aria-required="true"
                      {...register("city", registerFormRules.city)}
                      className={inputClass}
                    />
                    {errors.city && (
                      <p className={errorTextClass}>{errors.city.message}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <label htmlFor="lodgeId" className="ui-label">Loge</label>
                  {lodgesLoading ? (
                    <p className="py-2 text-sm text-neutral-500">Laddar loger…</p>
                  ) : (
                    <select
                      id="lodgeId"
                      {...register("lodgeId")}
                      className={selectClass}
                    >
                      <option value="">Välj loge…</option>
                      {lodges.map((lodge) => (
                        <option key={lodge.id} value={String(lodge.id)}>
                          {lodge.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <AllergiesManager
                  isEditRoute
                  selectedIds={selectedAllergyIds}
                  setSelectedIds={(ids) =>
                    setSelectedAllergyIds(Array.isArray(ids) ? ids : [])
                  }
                />

                <div>
                  <label htmlFor="notes" className="ui-label">Noteringar</label>
                  <textarea
                    id="notes"
                    rows={3}
                    {...register("notes")}
                    className={textareaClass}
                  />
                </div>

                <div>
                  <label htmlFor="picture" className="ui-label">
                    Profilbild{" "}
                    <span className="text-danger-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="picture"
                    type="file"
                    accept="image/*"
                    aria-required="true"
                    onChange={(e) => {
                      clearErrors("picture");
                      setPictureTouched(true);
                      setPicture(e.target.files?.[0] ?? null);
                    }}
                    className={inputClass}
                  />
                  {errors.picture?.message ? (
                    <p className={errorTextClass}>{errors.picture.message}</p>
                  ) : pictureError ? (
                    <p className={errorTextClass}>{pictureError}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-neutral-500">
                      JPEG, PNG, GIF eller WebP, max 5 MB
                    </p>
                  )}
                </div>
              </>
            )}

          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-200 pt-5">
            {step === 0 ? (
              <Link
                to=".."
                relative="path"
                className="ui-btn ui-btn-secondary"
              >
                Avbryt
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as StepIndex)}
                className="ui-btn ui-btn-secondary"
              >
                ← Föregående
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={advance}
                className="ui-btn ui-btn-primary"
              >
                Nästa →
              </button>
            ) : (
              <Button type="submit" loading={loading} disabled={loading}>
                Registrera
              </Button>
            )}
          </div>
        </div>
      </form>
    </PageContainer>
  );
};
