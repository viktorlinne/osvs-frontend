import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Spinner, NotFound } from "../components";
import useFetch from "../hooks/useFetch";
import { useError, useAuth } from "../context";
import type { PublicUser } from "../types";
import { adminUpdateUser, uploadUserPicture, postAchievement } from "../services/users";
import achievementsService from "../services/achievements";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema } from "../validators/users";
import { z } from "zod";

export default function MemberDetail() {
    const { id } = useParams<{ id: string }>();
    const { run, loading, data: member, notFound } = useFetch<PublicUser | null>();
    const { setError: setGlobalError, clearError: clearGlobalError } = useError();
    const { user } = useAuth();
    const [achievements, setAchievements] = useState<Array<{ id: number; aid: number; awardedAt: string; title: string }>>([]);
    const [available, setAvailable] = useState<Array<{ id: number; title: string }>>([]);
    const { user: currentUser } = useAuth();
    const canAward = Boolean(currentUser && (currentUser.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)));
    const [selectedAid, setSelectedAid] = useState<number | null>(null);
    const [awardDate, setAwardDate] = useState<string>("");

    const canEdit = Boolean(user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)));
    const location = useLocation();
    const isEditRoute = location.pathname.endsWith("/edit");

    const [saving, setSaving] = useState(false);
    const [pictureFile, setPictureFile] = useState<File | null>(null);
    // removed duplicate useError destructure; use `setGlobalError` / `clearGlobalError`

    type UpdateUserForm = z.infer<typeof updateUserSchema>;
    const { register, handleSubmit, reset, setError: setFieldError, formState: { errors } } = useForm<UpdateUserForm>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            firstname: "",
            lastname: "",
            dateOfBirth: "",
            official: undefined,
            notes: undefined,
            mobile: "",
            city: "",
            address: "",
            zipcode: "",
        }
    });

    useEffect(() => {
        if (!id) return setGlobalError("Saknar medlems-id");
        run(async () => {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`, { credentials: "include" });
            if (!resp.ok) throw new Error("Misslyckades att hämta medlem");
            const json = await resp.json();
            setAchievements(Array.isArray(json.achievements) ? json.achievements : []);
            return (json.user ?? null) as PublicUser | null;
        }).catch(() => { });
        (async () => {
            try {
                const list = await achievementsService.listAchievements();
                setAvailable(list);
            } catch {
                // ignore
            }
        })();
    }, [id, run, setGlobalError]);

    useEffect(() => {
        if (!member) return;
        reset({
            firstname: member.firstname ?? "",
            lastname: member.lastname ?? "",
            dateOfBirth: member.dateOfBirth ? String(member.dateOfBirth).slice(0, 10) : "",
            official: member.official ?? undefined,
            notes: member.notes ?? undefined,
            mobile: member.mobile ?? "",
            city: member.city ?? "",
            address: member.address ?? "",
            zipcode: member.zipcode ?? "",
        });
        setPictureFile(null);
    }, [member, reset]);

    return (
        <div className="flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full mx-auto p-6">
                <div className="flex items-center justify-between">
                    <Link to="/members" className="text-sm text-green-600 underline">← Tillbaka till medlemmar</Link>
                    {canEdit && !isEditRoute && (
                        <Link to={`/members/${id}/edit`} className="text-sm text-white bg-green-600 px-3 py-1 rounded">Edit</Link>
                    )}
                </div>
                <h2 className="text-2xl font-bold mt-4 mb-4">Medlem</h2>

                {loading && <Spinner />}
                {notFound ? (
                    <NotFound />
                ) : (
                    member && (
                        <form onSubmit={handleSubmit(async () => {
                            // noop here; actual save button handles submission
                        })} className="bg-white p-4 rounded shadow">
                            <div className="grid grid-cols-1 mb-4 justify-items-center">
                                <img src={`${import.meta.env.VITE_BACKEND_URL}${member.pictureUrl}`} alt={`${member.firstname} ${member.lastname}`} />
                                <label className="block text-sm font-medium mb-1">Utmärkelser</label>
                                <div>
                                    {achievements && achievements.length > 0 ? (
                                        <select className="w-full border rounded px-3 py-2">
                                            {achievements.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.title} — {a.awardedAt ? new Date(a.awardedAt).toLocaleDateString() : ""}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="text-sm text-gray-500">Inga utmärkelser</div>
                                    )}

                                    {canAward && isEditRoute ? (
                                        <div className="mt-2">
                                            <label className="block text-sm font-medium mb-1">Tilldela ny utmärkelse</label>
                                            <div className="flex gap-2">
                                                <select value={selectedAid ?? ""} onChange={(e) => setSelectedAid(e.target.value ? Number(e.target.value) : null)} className="border rounded px-3 py-2">
                                                    <option value="">Välj utmärkelse</option>
                                                    {available.map((opt) => (
                                                        <option key={opt.id} value={opt.id}>{opt.title}</option>
                                                    ))}
                                                </select>
                                                <input type="date" value={awardDate} onChange={(e) => setAwardDate(e.target.value)} className="border rounded px-3 py-2" />
                                                <button type="button" className="bg-green-600 hover:bg-green-700 transition text-white px-3 py-2 rounded" disabled={!selectedAid} onClick={async () => {
                                                    if (!selectedAid || !id) return setGlobalError("Invalid target");
                                                    clearGlobalError();
                                                    setSaving(true);
                                                    try {
                                                        await postAchievement(id as string, { achievementId: selectedAid, awardedAt: awardDate || undefined });
                                                        // re-fetch user and achievements
                                                        await run(async () => {
                                                            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`, { credentials: "include" });
                                                            if (!resp.ok) throw new Error("Misslyckades att hämta medlem");
                                                            const json = await resp.json();
                                                            setAchievements(Array.isArray(json.achievements) ? json.achievements : []);
                                                            return (json.user ?? null) as PublicUser | null;
                                                        });
                                                        setSelectedAid(null);
                                                        setAwardDate("");
                                                    } catch {
                                                        setGlobalError("Misslyckades att tilldela utmärkelse");
                                                    } finally {
                                                        setSaving(false);
                                                    }
                                                }}>Tilldela</button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Användarnamn</label>
                                    <input value={member.username ?? ""} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">E-post</label>
                                    <input value={member.email ?? ""} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Förnamn</label>
                                    <input {...register("firstname")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                    {errors.firstname && <p className="text-red-500 text-sm mt-1">{errors.firstname?.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Efternamn</label>
                                    <input {...register("lastname")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                    {errors.lastname && <p className="text-red-500 text-sm mt-1">{errors.lastname?.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Födelsedatum</label>
                                    <input type="date" {...register("dateOfBirth")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                    {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth?.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Gick med</label>
                                    <input value={member.createdAt ? new Date(member.createdAt).toLocaleDateString() : ""} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Mobilnummer</label>
                                <input {...register("mobile")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile?.message}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Adress</label>
                                <input {...register("address")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address?.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Postnummer</label>
                                    <input {...register("zipcode")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                    {errors.zipcode && <p className="text-red-500 text-sm mt-1">{errors.zipcode?.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Stad</label>
                                    <input {...register("city")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city?.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tjänst</label>
                                <input type="text" {...register("official")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Noteringar</label>
                                <input type="text" {...register("notes")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                            </div>

                            {canEdit && isEditRoute && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="bg-green-600 text-white px-4 py-2 rounded"
                                        disabled={saving}
                                        onClick={handleSubmit(async (values) => {
                                            if (!id) return setGlobalError("Saknar medlems-id");
                                            clearGlobalError();
                                            setSaving(true);
                                            try {
                                                await adminUpdateUser(id as string, {
                                                    firstname: String(values.firstname ?? "").trim(),
                                                    lastname: String(values.lastname ?? "").trim(),
                                                    mobile: String(values.mobile ?? "").trim(),
                                                    city: String(values.city ?? "").trim(),
                                                    dateOfBirth: values.dateOfBirth ? String(values.dateOfBirth) : null,
                                                    address: values.address ? String(values.address) : null,
                                                    zipcode: values.zipcode ? String(values.zipcode) : null,
                                                    official: values.official ?? null,
                                                    notes: values.notes ?? null,
                                                });
                                                if (pictureFile) await uploadUserPicture(id as string, pictureFile);
                                                // re-fetch
                                                await run(async () => {
                                                    const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`, { credentials: "include" });
                                                    if (!resp.ok) throw new Error("Misslyckades att hämta medlem");
                                                    const json = await resp.json();
                                                    setAchievements(Array.isArray(json.achievements) ? json.achievements : []);
                                                    return (json.user ?? null) as PublicUser | null;
                                                });
                                            } catch (e: unknown) {
                                                const err = e as { status?: number; details?: unknown };
                                                if (err?.status === 400 && err.details && typeof err.details === "object") {
                                                    const rec = err.details as Record<string, unknown>;
                                                    const missing = Array.isArray(rec.missing) ? rec.missing : undefined;
                                                    if (missing) {
                                                        missing.forEach((p: unknown) => {
                                                            if (typeof p === "string") setFieldError(p as keyof UpdateUserForm, { type: "server", message: "Ogiltigt värde" });
                                                        });
                                                        setSaving(false);
                                                        return;
                                                    }
                                                }
                                                setGlobalError("Misslyckades att uppdatera medlem");
                                            } finally {
                                                setSaving(false);
                                            }
                                        })}
                                    >
                                        Spara
                                    </button>
                                    {saving && <Spinner />}
                                </div>
                            )}
                        </form>
                    )
                )}
            </div>
        </div >
    );
}
