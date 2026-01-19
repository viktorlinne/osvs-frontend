import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { fetchData } from "../services/api";
import { listLodges } from "../services/lodges";
import type { RegisterForm, Lodge } from "../types";
import useFetch from "../hooks/useFetch";

import { useForm } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import useError from "../context/useError";

export const CreateMember = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [picture, setPicture] = useState<File | null>(null);
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
      username: "",
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
      if (values.work) fd.append("work", String(values.work));
      if (values.homeNumber) fd.append("homeNumber", String(values.homeNumber));
      fd.append("mobile", String(values.mobile ?? "").trim());
      fd.append("city", String(values.city ?? "").trim());
      fd.append("address", String(values.address ?? "").trim());
      fd.append("zipcode", String(values.zipcode ?? "").trim());
      if (values.lodgeId) fd.append("lodgeId", String(Number(values.lodgeId)));
      fd.append("notes", String(values.notes ?? "").trim());
      if (picture) fd.append("picture", picture);

      await runSubmit(() => fetchData(api.post("/auth/register", fd)));
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

  // error display handled by global ErrorProvider
  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="max-w-3xl w-full mx-auto p-6">
        <div className="w-full flex items-center justify-between">
          <Link
            to=".."
            relative="path"
            className="text-sm text-green-600 hover:text-green-700 hover:underline"
          >
            ← Tillbaka
          </Link>
        </div>
        <h2 className="text-2xl font-bold mt-4 mb-4">Skapa användare</h2>

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

        <form className="bg-white p-4 rounded-md shadow space-y-3">
          <input
            placeholder="Användarnamn"
            {...register("username")}
            className="w-full px-4 py-2 border"
          />

          <input
            placeholder="Email"
            {...register("email")}
            className="w-full px-4 py-2 border"
          />

          <input
            placeholder="Lösenord"
            type="password"
            {...register("password")}
            className="w-full px-4 py-2 border"
            autoComplete="off"
          />

          <input
            placeholder="Förnamn"
            type="text"
            {...register("firstname")}
            className="w-full px-4 py-2 border"
          />

          <input
            placeholder="Efternamn"
            type="text"
            {...register("lastname")}
            className="w-full px-4 py-2 border"
          />

          <label className="block">
            <div className="text-sm text-gray-600">Födelsedatum</div>
            <input
              type="date"
              {...register("dateOfBirth")}
              className="w-full px-4 py-2 border"
            />
          </label>

          <input
            placeholder="Jobb"
            type="text"
            {...register("work")}
            className="w-full px-4 py-2 border"
          />

          <input
            placeholder="Mobilnummer"
            type="text"
            {...register("mobile")}
            className="w-full px-4 py-2 border"
          />

          <input
            placeholder="Hemnummer"
            type="text"
            {...register("homeNumber")}
            className="w-full px-4 py-2 border"
          />

          <input
            placeholder="Stad"
            type="text"
            {...register("city")}
            className="w-full px-4 py-2 border"
          />

          <input
            placeholder="Adress"
            type="text"
            {...register("address")}
            className="w-full px-4 py-2 border"
          />

          <input
            placeholder="Postnummer"
            type="text"
            {...register("zipcode")}
            className="w-full px-4 py-2 border"
          />

          <input
            placeholder="Noteringar "
            type="text"
            {...register("notes")}
            className="w-full px-4 py-2 border"
          />

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
          </label>

          <label className="block border">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPicture(e.target.files?.[0] ?? null)}
              className="w-full px-4 py-2"
            />
          </label>

          <div className="flex items-center gap-x-4 py-4">
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-sm font-medium transition text-white px-4 py-2 rounded-md"
            >
              {loading ? "Skapar..." : "Skapa användare"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
