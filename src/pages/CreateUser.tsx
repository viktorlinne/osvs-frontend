import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import api, { fetchData } from "../services/api";
import { listLodges } from "../services/lodges";
import type { RegisterForm, Lodge } from "../types";

import { useForm } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import useError from "../context/useError";

export const CreateUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [picture, setPicture] = useState<File | null>(null);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [lodgesLoading, setLodgesLoading] = useState(true);

  const { setError } = useError();

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstname: "",
      lastname: "",
      dateOfBirth: "",
      official: "",
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
    const picErr = validatePicture();
    if (picErr) return setError(picErr);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("username", String(values.username ?? "").trim());
      fd.append("email", String(values.email ?? "").trim());
      fd.append("password", String(values.password ?? ""));
      fd.append("firstname", String(values.firstname ?? "").trim());
      fd.append("lastname", String(values.lastname ?? "").trim());
      fd.append("dateOfBirth", String(values.dateOfBirth ?? ""));
      if (values.official) fd.append("official", String(values.official));
      if (values.homeNumber) fd.append("homeNumber", String(values.homeNumber));
      fd.append("mobile", String(values.mobile ?? "").trim());
      fd.append("city", String(values.city ?? "").trim());
      fd.append("address", String(values.address ?? "").trim());
      fd.append("zipcode", String(values.zipcode ?? "").trim());
      if (values.lodgeId) fd.append("lodgeId", String(Number(values.lodgeId)));
      fd.append("notes", String(values.notes ?? "").trim());
      if (picture) fd.append("picture", picture);

      await fetchData(api.post("/auth/register", fd));
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
              // set as field error
              setFieldError(p as keyof RegisterForm, {
                type: "server",
                message: "Ogiltigt värde",
              });
            }
          });
          return;
        }
      }

      if (e instanceof Error)
        setError(e.message ?? "Kunde inte skapa användare");
      else setError(String(e ?? "Kunde inte skapa användare"));
    } finally {
      setLoading(false);
    }
  }

  // Load lodges on mount
  useEffect(() => {
    (async () => {
      try {
        setLodgesLoading(true);
        const data = await listLodges();
        if (Array.isArray(data)) {
          setLodges(data as Lodge[]);
        } else if (data && typeof data === "object") {
          const lodgesField = (data as Record<string, unknown>)["lodges"];
          if (Array.isArray(lodgesField)) {
            setLodges(lodgesField as Lodge[]);
          }
        }
      } catch {
        // ignore; validation will catch missing lodge
      } finally {
        setLodgesLoading(false);
      }
    })();
  }, []);

  // error display handled by global ErrorProvider
  return (
    <div className="max-w-xl mx-auto p-4 min-h-screen">
      <h2 className="text-2xl mb-4">Skapa användare</h2>
      {/* Centralized field error list (component is source of truth) */}
      {Object.keys(errors).length > 0 && (
        <div className="text-red-600 mb-2">
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
      <form className="space-y-3">
        <input
          placeholder="Användarnamn"
          {...register("username")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <input
          placeholder="Email"
          {...register("email")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <input
          placeholder="Lösenord"
          type="password"
          {...register("password")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <input
          placeholder="Förnamn"
          type="text"
          {...register("firstname")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <input
          placeholder="Efternamn"
          type="text"
          {...register("lastname")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <label className="block">
          <div className="text-sm text-gray-600">Födelsedatum</div>
          <input
            type="date"
            {...register("dateOfBirth")}
            className="w-full px-4 py-2 border"
          />
          {/* field errors shown centrally above */}
        </label>
        <input
          placeholder="Tjänst"
          type="text"
          {...register("official")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <input
          placeholder="Mobilnummer"
          type="text"
          {...register("mobile")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <input
          placeholder="Hemnummer"
          type="text"
          {...register("homeNumber")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <input
          placeholder="Stad"
          type="text"
          {...register("city")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <input
          placeholder="Adress"
          type="text"
          {...register("address")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <input
          placeholder="Postnummer"
          type="text"
          {...register("zipcode")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <input
          placeholder="Noteringar "
          type="text"
          {...register("notes")}
          className="w-full px-4 py-2 border"
        />
        {/* field errors shown centrally above */}
        <label className="block">
          {lodgesLoading ? (
            <div className="px-4 py-2">Laddar loger…</div>
          ) : (
            <select
              {...register("lodgeId")}
              className="w-full px-4 py-2 border"
            >
              <option value="">Välj loge...</option>
              {lodges.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
          {/* field errors shown centrally above */}
        </label>
        <label className="block border">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPicture(e.target.files?.[0] ?? null)}
            className="w-full px-4 py-2"
          />
        </label>
        <div>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 transition text-white rounded"
          >
            {loading ? "Skapar..." : "Skapa användare"}
          </button>
        </div>
      </form>
    </div>
  );
};
