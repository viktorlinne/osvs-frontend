import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import {
  AllergiesManager,
  PageContainer,
  errorTextClass,
  inputClass,
  selectClass,
} from "../components";
import useError from "../context/useError";
import useFetch from "../hooks/useFetch";
import { setMemberAllergies } from "../services/allergies";
import { registerMember } from "../services/auth";
import { listLodges } from "../services/lodges";
import type { Lodge, RegisterForm } from "../types";
import { applyApiFieldErrors } from "../utils/apiErrors";
import {
  registerFormRules,
  validateImageFile,
} from "../utils/formValidation";

type RegisterResponse = {
  user?: { matrikelnummer?: unknown };
};

export const CreateMember = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [picture, setPicture] = useState<File | null>(null);
  const [createdUserId, setCreatedUserId] = useState<number | null>(null);
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[]>([]);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const { run: runLodges, loading: lodgesLoading } = useFetch<Lodge[]>();
  const { run: runSubmit } = useFetch<unknown>();

  const { setError } = useError();

  const {
    register,
    handleSubmit,
    clearErrors,
    setError: setFieldError,
    formState: { errors, isValid },
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

  const pictureError =
    createdUserId === null
      ? validateImageFile(picture, { required: true })
      : null;

  async function onSubmit(values: RegisterForm) {
    setError(null);
    clearErrors();
    setLoading(true);
    try {
      let userId = createdUserId;
      if (userId === null) {
        const picErr = validateImageFile(picture, { required: true });
        if (picErr) {
          setError(picErr);
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
        fd.append("notes", String(values.notes ?? "").trim());
        if (picture) fd.append("picture", picture);

        const registerResponse = (await runSubmit(() =>
          registerMember(fd),
        )) as RegisterResponse;

        const parsedId = Number(registerResponse?.user?.matrikelnummer);
        if (!Number.isFinite(parsedId)) {
          navigate("/members");
          return;
        }

        userId = parsedId;
        setCreatedUserId(parsedId);
      }

      if (userId === null) return;

      try {
        await runSubmit(() =>
          setMemberAllergies(
            userId,
            Array.isArray(selectedAllergyIds) ? selectedAllergyIds : [],
          ),
        );
      } catch {
        setError(`Användare skapad (ID ${userId}) men allergier kunde inte sparas.`);
        return;
      }

      navigate("/members");
    } catch (error: unknown) {
      if (applyApiFieldErrors(error, setFieldError)) {
        return;
      }

      if (error instanceof Error) {
        setError(error.message ?? "Kunde inte skapa användare");
      } else {
        setError(String(error ?? "Kunde inte skapa användare"));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runLodges(() => listLodges())
      .then((data) => {
        if (Array.isArray(data)) setLodges(data as Lodge[]);
        else if (data && typeof data === "object") {
          const lodgesField = (data as Record<string, unknown>)["lodges"];
          if (Array.isArray(lodgesField)) setLodges(lodgesField as Lodge[]);
        }
      })
      .catch(() => {
        // ignore; validation will catch missing lodge
      });
  }, [runLodges]);

  return (
    <PageContainer size="md" className="ui-page">
      <div className="mb-4 flex w-full items-center justify-between">
        <Link to=".." relative="path" className="ui-link">
          ← Tillbaka
        </Link>
      </div>
      <h2 className="ui-page-title mb-4">Skapa användare</h2>

      {Object.keys(errors).length > 0 && (
        <div className={`${errorTextClass} mb-2`}>
          <ul className="list-disc pl-5">
            {(Object.keys(errors) as Array<keyof RegisterForm>).map((key) => {
              const fieldErr = errors[key] as FieldError | undefined;
              const msg = fieldErr?.message;
              return msg ? (
                <li key={String(key)}>{`${String(key)}: ${msg}`}</li>
              ) : null;
            })}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="ui-card space-y-3">
        <input
          placeholder="Email"
          {...register("email", registerFormRules.email)}
          className={inputClass}
        />

        <input
          placeholder="Lösenord"
          type="password"
          {...register("password", registerFormRules.password)}
          className={inputClass}
          autoComplete="off"
        />

        <input
          placeholder="Förnamn"
          type="text"
          {...register("firstname", registerFormRules.firstname)}
          className={inputClass}
        />

        <input
          placeholder="Efternamn"
          type="text"
          {...register("lastname", registerFormRules.lastname)}
          className={inputClass}
        />

        <label className="ui-label">
          Födelsedatum
          <input
            type="date"
            {...register("dateOfBirth", registerFormRules.dateOfBirth)}
            className={inputClass}
          />
        </label>

        <input
          placeholder="Jobb eller tidigare sysselsättning"
          type="text"
          {...register("work")}
          className={inputClass}
        />

        <input
          placeholder="Mobilnummer"
          type="text"
          inputMode="tel"
          {...register("mobile", registerFormRules.mobile)}
          className={inputClass}
        />

        <input
          placeholder="Hemnummer"
          type="text"
          inputMode="tel"
          {...register("homeNumber", registerFormRules.homeNumber)}
          className={inputClass}
        />

        <input
          placeholder="Stad"
          type="text"
          {...register("city", registerFormRules.city)}
          className={inputClass}
        />

        <input
          placeholder="Adress"
          type="text"
          {...register("address", registerFormRules.address)}
          className={inputClass}
        />

        <input
          placeholder="Postnummer"
          type="text"
          inputMode="numeric"
          {...register("zipcode", registerFormRules.zipcode)}
          className={inputClass}
        />

        <input
          placeholder="Noteringar"
          type="text"
          {...register("notes")}
          className={inputClass}
        />

        <AllergiesManager
          isEditRoute
          selectedIds={selectedAllergyIds}
          setSelectedIds={(ids) => setSelectedAllergyIds(Array.isArray(ids) ? ids : [])}
        />

        <label className="ui-label">
          Loge
          {lodgesLoading ? (
            <div className="py-2 text-neutral-600">Laddar loger…</div>
          ) : (
            <select {...register("lodgeId")} className={selectClass}>
              <option value="">Välj loge...</option>
              {lodges.map((lodge) => (
                <option key={lodge.id} value={String(lodge.id)}>
                  {lodge.name}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="ui-label">
          Profilbild
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPicture(e.target.files?.[0] ?? null)}
            className={inputClass}
          />
          {pictureError ? (
            <p className={errorTextClass}>{pictureError}</p>
          ) : null}
        </label>

        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <button
            type="submit"
            disabled={
              loading ||
              (createdUserId === null && (!isValid || Boolean(pictureError)))
            }
            className="ui-btn ui-btn-primary"
          >
            {loading
              ? createdUserId !== null
                ? "Sparar..."
                : "Skapar..."
              : createdUserId !== null
                ? "Spara allergier"
                : "Skapa"}
          </button>
        </div>
      </form>
    </PageContainer>
  );
};
