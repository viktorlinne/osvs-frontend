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
import api, { fetchData } from "../services/api";
import { listLodges } from "../services/lodges";
import type { Lodge, RegisterForm } from "../types";

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
    setError: setFieldError,
    formState: { errors },
  } = useForm<RegisterForm>({
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

  function validatePicture(): string | null {
    if (!picture) return "Profilbild är obligatorisk";
    if (picture.size > 5 * 1024 * 1024)
      return "Profilbilden måste vara högst 5MB";
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(picture.type))
      return "Profilbilden måste vara JPEG, PNG, GIF eller WebP";
    return null;
  }

  async function onSubmit(values: RegisterForm) {
    setError(null);
    setLoading(true);
    try {
      let userId = createdUserId;
      if (userId === null) {
        const picErr = validatePicture();
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
        if (values.homeNumber) fd.append("homeNumber", String(values.homeNumber));
        fd.append("mobile", String(values.mobile ?? "").trim());
        fd.append("city", String(values.city ?? "").trim());
        fd.append("address", String(values.address ?? "").trim());
        fd.append("zipcode", String(values.zipcode ?? "").trim());
        if (values.lodgeId) fd.append("lodgeId", String(Number(values.lodgeId)));
        fd.append("notes", String(values.notes ?? "").trim());
        if (picture) fd.append("picture", picture);

        const registerResponse = (await runSubmit(() =>
          fetchData(api.post("/auth/register", fd)),
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
          setMemberAllergies(userId, Array.isArray(selectedAllergyIds) ? selectedAllergyIds : []),
        );
      } catch {
        setError(
          `Anv\u00E4ndare skapad (ID ${userId}) men allergier kunde inte sparas.`,
        );
        return;
      }

      navigate("/members");
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
              setFieldError(p as keyof RegisterForm, {
                type: "server",
                message: "Ogiltigt värde",
              });
            }
          });
          return;
        }
      }

      if (e instanceof Error) setError(e.message ?? "Kunde inte skapa användare");
      else setError(String(e ?? "Kunde inte skapa användare"));
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
            {(Object.keys(errors) as Array<keyof RegisterForm>).map((k) => {
              const fieldErr = errors[k] as FieldError | undefined;
              const msg = fieldErr?.message;
              return msg ? (
                <li key={String(k)}>{`${String(k)}: ${msg}`}</li>
              ) : null;
            })}
          </ul>
        </div>
      )}

      <form className="ui-card space-y-3">
        <input placeholder="Email" {...register("email")} className={inputClass} />

        <input
          placeholder="Lösenord"
          type="password"
          {...register("password")}
          className={inputClass}
          autoComplete="off"
        />

        <input
          placeholder="Förnamn"
          type="text"
          {...register("firstname")}
          className={inputClass}
        />

        <input
          placeholder="Efternamn"
          type="text"
          {...register("lastname")}
          className={inputClass}
        />

        <label className="ui-label">
          Födelsedatum
          <input type="date" {...register("dateOfBirth")} className={inputClass} />
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
          {...register("mobile")}
          className={inputClass}
        />

        <input
          placeholder="Hemnummer"
          type="text"
          {...register("homeNumber")}
          className={inputClass}
        />

        <input placeholder="Stad" type="text" {...register("city")} className={inputClass} />

        <input
          placeholder="Adress"
          type="text"
          {...register("address")}
          className={inputClass}
        />

        <input
          placeholder="Postnummer"
          type="text"
          {...register("zipcode")}
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
            <div className="py-2 text-neutral-600">Laddar logerâ€¦</div>
          ) : (
            <select {...register("lodgeId")} className={selectClass}>
              <option value="">Välj loge...</option>
              {lodges.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.name}
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
        </label>

        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="ui-btn ui-btn-primary"
          >
            {loading
              ? createdUserId !== null
                ? "Sparar..."
                : "Skapar..."
              : createdUserId !== null
                ? "Spara allergier"
                : "Skapa anv\u00E4ndare"}
          </button>
        </div>
      </form>
    </PageContainer>
  );
};
