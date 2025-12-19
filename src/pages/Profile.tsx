import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, useError } from "../context";
import { postAchievement, updateMe, uploadMyPicture } from "../services";
import achievementsService from "../services/achievements";
import { Spinner } from "../components";
import type { PublicUser } from "../types/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema } from "../validators/users";
import { z } from "zod";

export default function Profile() {
    const { user, refresh } = useAuth();
    const location = useLocation();
    const isEditRoute = location.pathname.endsWith("/edit");
    const { setError: setGlobalError, clearError: clearGlobalError } = useError();

    const [saving, setSaving] = useState(false);
    const [pictureFile, setPictureFile] = useState<File | null>(null);
    const achievements: PublicUser["achievements"] = user?.achievements ?? [];
    const [available, setAvailable] = useState<Array<{ id: number; title: string }>>([]);
    const canAward = Boolean(user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)));
    const [selectedAid, setSelectedAid] = useState<number | null>(null);
    const [awardDate, setAwardDate] = useState<string>("");

    type UpdateUserForm = z.infer<typeof updateUserSchema>;
    const { register, handleSubmit, reset, setError: setFieldError, formState: { errors } } = useForm<UpdateUserForm>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            firstname: user?.firstname ?? "",
            lastname: user?.lastname ?? "",
            dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
            official: user?.official ?? undefined,
            notes: user?.notes ?? undefined,
            mobile: user?.mobile ?? "",
            homeNumber: user?.homeNumber ?? "",
            city: user?.city ?? "",
            address: user?.address ?? "",
            zipcode: user?.zipcode ?? "",
        }
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const list = await achievementsService.listAchievements();
                if (mounted) setAvailable(list);
            } catch {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        // keep form in sync when `user` changes
        reset({
            firstname: user?.firstname ?? "",
            lastname: user?.lastname ?? "",
            dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
            official: user?.official ?? undefined,
            notes: user?.notes ?? undefined,
            mobile: user?.mobile ?? "",
            homeNumber: user?.homeNumber ?? "",
            city: user?.city ?? "",
            address: user?.address ?? "",
            zipcode: user?.zipcode ?? "",
        });
    }, [user, reset]);

    async function onSave(values: Record<string, unknown>) {
        clearGlobalError();
        setSaving(true);
        try {
            await updateMe({
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
            if (pictureFile) {
                await uploadMyPicture(pictureFile);
            }
            await refresh();
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
            setGlobalError("Misslyckades att uppdatera profilen");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full mx-auto p-6">
                <div className="flex items-center justify-between">
                    <Link to="/" className="text-sm text-green-600 underline">← Tillbaka</Link>
                    {user && !isEditRoute && (
                        <Link to="/profile/edit" className="text-sm text-white bg-green-600 px-3 py-1 rounded">Edit</Link>
                    )}
                </div>
                <h2 className="text-2xl font-bold mt-4 mb-4">Din profil</h2>
                <form onSubmit={handleSubmit(onSave)} className="bg-white p-4 rounded shadow">
                    <div className="grid grid-cols-1 mb-4 justify-items-center">
                        <img src={`${import.meta.env.VITE_BACKEND_URL}${user?.pictureUrl}`} alt={`${user?.pictureUrl}`} />
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

                            {isEditRoute && canAward ? (
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
                                            if (!selectedAid || !user?.id) return;
                                            try {
                                                await postAchievement(user.id, { achievementId: selectedAid, awardedAt: awardDate || undefined });
                                                await refresh();
                                                setSelectedAid(null);
                                                setAwardDate("");
                                            } catch {
                                                setGlobalError("Misslyckades att tilldela utmärkelse");
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
                            <input value={user?.username ?? ""} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">E-post</label>
                            <input value={user?.email ?? ""} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Förnamn</label>
                            <input {...register("firstname")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                            {errors.firstname && <p className="text-red-500 text-sm mt-1">{errors.firstname?.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Efternamn</label>
                            <input {...register("lastname")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                            {errors.lastname && <p className="text-red-500 text-sm mt-1">{errors.lastname?.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Födelsedatum</label>
                            <input type="date" {...register("dateOfBirth")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                            {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth?.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Registrerad</label>
                            <input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Mobilnummer</label>
                            <input type="number" {...register("mobile")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                            {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile?.message}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Hemnummer</label>
                            <input type="number" {...register("homeNumber")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Adress</label>
                        <input {...register("address")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address?.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Postnummer</label>
                            <input type="number" {...register("zipcode")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                            {errors.zipcode && <p className="text-red-500 text-sm mt-1">{errors.zipcode?.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Stad</label>
                            <input {...register("city")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city?.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Tjänst</label>
                        <input type="text" {...register("official")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                        {errors.official && <p className="text-red-500 text-sm mt-1">{errors.official?.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Noteringar</label>
                        <input type="text" {...register("notes")} readOnly={!isEditRoute} className={`${isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                        {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes?.message}</p>}
                    </div>

                    {isEditRoute ? (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Profilbild</label>

                            <input type="file" accept="image/*" onChange={(e) => setPictureFile(e.target.files ? e.target.files[0] : null)} />

                        </div>
                    ) : null}
                    {isEditRoute ? (
                        <div className="flex items-center gap-2">
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={saving}>
                                Spara
                            </button>
                            {saving && <Spinner />}
                        </div>
                    ) : null}
                </form>
            </div>
        </div>
    );
};

