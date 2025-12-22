import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Spinner, NotFound } from "../components";
import useFetch from "../hooks/useFetch";
import { useError, useAuth } from "../context";
import type { PublicUser, Achievement, Lodge, Role } from "@osvs/types";
import { adminUpdateUser, uploadUserPicture, postAchievement, getUserLodge, setUserLodge } from "../services/users";
import achievementsService from "../services/achievements";
import lodgesService from "../services/lodges";
import { listRoles } from "../services/admin";
import { setRoles } from "../services";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema, type UpdateUserForm } from "../validators/users";

export default function MemberDetail() {
    const { id } = useParams<{ id: string }>();
    const { run, loading, data: member, notFound } = useFetch<PublicUser | null>();
    const { setError: setGlobalError, clearError: clearGlobalError } = useError();
    const { user } = useAuth();
    const { user: currentUser } = useAuth();
    const canAward = Boolean(currentUser && (currentUser.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)));
    const [selectedAid, setSelectedAid] = useState<number | null>(null);
    const [awardDate, setAwardDate] = useState<string>("");
    const [selectedLid, setSelectedLid] = useState<number | null>(null);
    const [available, setAvailable] = useState<Achievement[]>([]);
    const [lodges, setLodges] = useState<Lodge[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [rolesList, setRolesList] = useState<Role[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

    const canEdit = Boolean(user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)));
    const location = useLocation();
    const isEditRoute = location.pathname.endsWith("/edit");

    const [saving, setSaving] = useState(false);
    const [pictureFile, setPictureFile] = useState<File | null>(null);
    // removed duplicate useError destructure; use `setGlobalError` / `clearGlobalError`

    const { register, handleSubmit, reset, setError: setFieldError, formState: { errors } } = useForm<UpdateUserForm>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            firstname: "",
            lastname: "",
            dateOfBirth: "",
            official: undefined,
            notes: undefined,
            mobile: "",
            homeNumber: "",
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
        // fetch lodges list and current user's lodge
        (async () => {
            try {
                const l = await lodgesService.listLodges();
                setLodges(Array.isArray(l) ? l : []);
            } catch {
                // ignore
            }
            try {
                const r = await listRoles();
                // accept either an array or { roles: [...] }
                const raw = r as Record<string, unknown> | undefined;
                let items: Array<Record<string, unknown>> = [];
                if (Array.isArray(r)) items = r as Array<Record<string, unknown>>;
                else if (raw && Array.isArray(raw.roles)) items = raw.roles as Array<Record<string, unknown>>;
                if (items.length > 0) {
                    const rolesArray = items.map(item => ({
                        id: Number(item.id),
                        name: String(item.name ?? item.role ?? item.roleName ?? "")
                    }));
                    setRolesList(rolesArray);
                }
            } catch {
                // ignore
            }
            try {
                const cur = await getUserLodge(id as string);
                setSelectedLid(cur?.lodge ? Number(cur.lodge.id) : null);
            } catch {
                // ignore
            }
        })();
    }, [id, run, setGlobalError]);

    useEffect(() => {
        // when member and rolesList available, set selectedRoleIds
        if (!member) return;
        if (!rolesList || rolesList.length === 0) return;
        const memberRoles = ((member as unknown) as Record<string, unknown>)['roles'] as Array<unknown> | undefined;
        const ids = (memberRoles ?? []).map((rn: unknown) => {
            const rnName = typeof rn === "string" ? rn : ((): string => {
                const rec = rn as Record<string, unknown>;
                return String(rec['name'] ?? rec['role'] ?? rec['id'] ?? '');
            })();
            return rolesList.find(r => r.name === rnName)?.id;
        }).filter((v: unknown): v is number => Boolean(v));
        setSelectedRoleIds(ids);
    }, [member, rolesList]);

    useEffect(() => {
        if (!member) return;
        reset({
            firstname: member.firstname ?? "",
            lastname: member.lastname ?? "",
            dateOfBirth: member.dateOfBirth ? String(member.dateOfBirth).slice(0, 10) : "",
            official: member.official ?? undefined,
            notes: member.notes ?? undefined,
            mobile: member.mobile ?? "",
            homeNumber: member.homeNumber ?? "",
            city: member.city ?? "",
            address: member.address ?? "",
            zipcode: member.zipcode ?? "",
        });
        setPictureFile(null);

    }, [member, reset]);

    useEffect(() => {
        if (!pictureFile) {

            return;
        }
        const url = URL.createObjectURL(pictureFile);

        return () => {
            URL.revokeObjectURL(url);

        };
    }, [pictureFile]);

    return (
        <div className="flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full mx-auto p-6">
                <div className="flex items-center justify-between">
                    <Link to="/members" className="text-sm text-green-600 underline">← Tillbaka till medlemmar</Link>
                    {canEdit && !isEditRoute && (
                        <Link to={`/members/${id}/edit`} className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded">Edit</Link>
                    )}
                </div>
                <h2 className="text-2xl font-bold mt-4 mb-4">Medlem</h2>

                {loading && <Spinner />}
                {notFound ? (
                    <NotFound />
                ) : (
                    member && (
                        <form onSubmit={handleSubmit(async () => { /* noop; Save button handles submit */ })} className="bg-white p-4 rounded shadow">
                            <div className="grid grid-cols-1 mb-4 justify-items-center">
                                <img src={`${`${import.meta.env.VITE_BACKEND_URL}${member.pictureUrl}`}`} alt={`${member.firstname} ${member.lastname}`} className="w-32 h-32 rounded-full object-cover" />
                                <label className="block text-sm font-medium mb-1">Utmärkelser</label>
                                <div className="flex flex-col items-center">
                                    {achievements && achievements.length > 0 ? (
                                        <select className="border rounded px-3 py-2 mb-2">
                                            {achievements.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.title} — {a.awardedAt ? new Date(a.awardedAt).toLocaleDateString() : ""}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="text-sm text-gray-500">Inga utmärkelser</div>
                                    )}

                                    {canAward && isEditRoute && (
                                        <div className="text-center">
                                            <label className="block text-sm font-medium mb-1">Tilldela ny utmärkelse</label>
                                            <div className="flex justify-center gap-2">
                                                <select value={selectedAid ?? ""} onChange={(e) => setSelectedAid(e.target.value ? Number(e.target.value) : null)} className="border rounded px-3 py-2">
                                                    <option value="">Välj utmärkelse</option>
                                                    {available.map((opt) => (
                                                        <option key={opt.id} value={opt.id}>{opt.title}</option>
                                                    ))}
                                                </select>
                                                <input type="date" value={awardDate} onChange={(e) => setAwardDate(e.target.value)} className="border rounded p-2" />
                                                <button type="button" className="bg-green-600 hover:bg-green-700 transition text-white p-2 rounded" disabled={!selectedAid} onClick={async () => {
                                                    if (!selectedAid || !id) return setGlobalError("Invalid target");
                                                    clearGlobalError();
                                                    setSaving(true);
                                                    try {
                                                        await postAchievement(id as string, { achievementId: selectedAid, awardedAt: awardDate || undefined });
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
                                    )}
                                </div>
                            </div>

                            <div className="mb-4 text-center">
                                {canEdit && isEditRoute ? (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Loge</label>
                                        <div className="flex gap-2 items-center justify-center">
                                            <select value={selectedLid ?? ""} onChange={(e) => setSelectedLid(e.target.value ? Number(e.target.value) : null)} className="border rounded px-3 py-2">
                                                <option value="">Ingen loge</option>
                                                {lodges.map((l) => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                            <button type="button" className="bg-green-600 hover:bg-green-700 transition text-white px-3 py-2 rounded" onClick={async () => {
                                                if (!id) return setGlobalError("Invalid target");
                                                clearGlobalError();
                                                setSaving(true);
                                                try {
                                                    await setUserLodge(id as string, selectedLid === null ? null : Number(selectedLid));
                                                    await run(async () => {
                                                        const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`, { credentials: "include" });
                                                        if (!resp.ok) throw new Error("Misslyckades att hämta medlem");
                                                        const json = await resp.json();
                                                        setAchievements(Array.isArray(json.achievements) ? json.achievements : []);
                                                        return (json.user ?? null) as PublicUser | null;
                                                    });
                                                } catch {
                                                    setGlobalError("Misslyckades att uppdatera loge");
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}>Spara loge</button>
                                        </div>
                                    </div>
                                ) : null}

                                {canEdit && isEditRoute ? (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium mb-1">Roller</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {rolesList.map((r) => (
                                                <label key={r.id} className="inline-flex items-center gap-2">
                                                    <input type="checkbox" checked={selectedRoleIds.includes(r.id)} onChange={(e) => {
                                                        const next = e.target.checked ? [...selectedRoleIds, r.id] : selectedRoleIds.filter(id => id !== r.id);
                                                        setSelectedRoleIds(next);
                                                    }} />
                                                    <span className="text-sm">{r.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="mt-2">
                                            <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded" onClick={async () => {
                                                if (!id) return setGlobalError("Invalid target");
                                                clearGlobalError();
                                                setSaving(true);
                                                try {
                                                    await setRoles(id as string, selectedRoleIds);
                                                    await run(async () => {
                                                        const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`, { credentials: "include" });
                                                        if (!resp.ok) throw new Error("Misslyckades att hämta medlem");
                                                        const json = await resp.json();
                                                        setAchievements(Array.isArray(json.achievements) ? json.achievements : []);
                                                        return (json.user ?? null) as PublicUser | null;
                                                    });
                                                } catch {
                                                    setGlobalError("Misslyckades att uppdatera roller");
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}>Spara roller</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Loge</label>
                                        <div className="text-sm text-gray-700">{lodges.find(l => l.id === selectedLid)?.name ?? "Ingen loge"}</div>
                                    </div>
                                )}
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

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Mobilnummer</label>
                                    <input type="number" {...register("mobile")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                    {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile?.message}</p>}
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Hemnummer</label>
                                    <input type="number" {...register("homeNumber")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Adress</label>
                                <input {...register("address")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address?.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Postnummer</label>
                                    <input type="number" {...register("zipcode")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
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
                                <input type="text" {...register("official")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                                {errors.official && <p className="text-red-500 text-sm mt-1">{errors.official?.message}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Noteringar</label>
                                <input type="text" {...register("notes")} readOnly={!(canEdit && isEditRoute)} className={`${canEdit && isEditRoute ? "" : "bg-gray-100"} w-full border rounded px-3 py-2`} />
                            </div>

                            {canEdit && isEditRoute && (
                                <div className="mt-2">
                                    <label className="block text-sm font-medium mb-1">Uppdatera profilbild</label>
                                    <input type="file" accept="image/*" onChange={(e) => setPictureFile(e.target.files && e.target.files.length > 0 ? e.target.files[0] : null)} />
                                </div>
                            )}

                            {canEdit && isEditRoute && (
                                <div className="flex items-center gap-2 mt-4">
                                    <button
                                        type="button"
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
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
                                                    homeNumber: values.homeNumber ? String(values.homeNumber) : null,
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
