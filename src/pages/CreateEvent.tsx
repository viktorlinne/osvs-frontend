import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useError, useAuth } from "../context";
import { createEvent as createEventSvc, linkLodgeEvent } from "../services";
import type { CreateEventPayload } from "@osvs/types";
import { listLodges } from "../services/lodges";
import type { Lodge } from "@osvs/types";


export const CreateEvent = () => {
    const navigate = useNavigate();
    const { setError: setGlobalError, clearError: clearGlobalError } = useError();
    const { user } = useAuth();
    const canCreate = Boolean(user && (user.roles ?? []).some((r: string) => ["Admin", "Editor"].includes(r)));

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        price: "",
        lodgeMeeting: false,
    });
    const [lodges, setLodges] = useState<Lodge[]>([]);
    const [selectedLodgeIds, setSelectedLodgeIds] = useState<number[]>([]);

    useEffect(() => {
        let mounted = true;
        void (async () => {
            try {
                const list = await listLodges();
                if (!mounted) return;
                setLodges(list);
            } catch {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, []);

    async function handleCreate(e?: React.FormEvent) {
        e?.preventDefault();
        clearGlobalError();
        if (!canCreate) return setGlobalError("Du har inte behörighet att skapa möten");
        if (!form.title) return setGlobalError("Titel är obligatorisk");
        if (!form.description) return setGlobalError("Beskrivning är obligatorisk");
        if (!form.startDate) return setGlobalError("Startdatum är obligatoriskt");
        if (!form.endDate) return setGlobalError("Slutdatum är obligatoriskt");
        setSaving(true);
        try {
            const payload: CreateEventPayload = {
                title: form.title,
                description: form.description || null,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                price: form.price ? Number(form.price) : undefined,
                lodgeMeeting: form.lodgeMeeting,
            };

            const resp = await createEventSvc(payload);
            // backend returns { success: true, id } (id is number) or { event: { id } }
            const raw = (resp as Record<string, unknown> | null) ?? null;
            const maybeId = raw ? (raw.id ?? ((raw.event as Record<string, unknown> | undefined)?.id)) : null;
            let createdIdNum: number | null = null;
            if (typeof maybeId === "number" && Number.isFinite(maybeId)) {
                createdIdNum = maybeId as number;
            } else if (typeof maybeId === "string" && maybeId.trim() !== "") {
                const n = Number(maybeId);
                if (Number.isFinite(n)) createdIdNum = n;
            }

            if (createdIdNum !== null) {
                const eventId = createdIdNum;
                if (selectedLodgeIds.length > 0) {
                    // link selected lodges; don't block navigation on individual failures
                    await Promise.allSettled(
                        selectedLodgeIds.map((lid) => linkLodgeEvent(eventId, lid))
                    );
                }
                navigate(`/events/${eventId}`);
            } else {
                navigate(`/events`);
            }
        } catch {
            setGlobalError("Failed to create event");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-3xl w-full mx-auto p-6 min-h-screen">
            <div className="flex items-center justify-between">
                <Link to="/events" className="text-sm text-green-600 underline">← Tillbaka till möten</Link>
            </div>

            <h2 className="text-2xl font-bold mt-4 mb-4">Skapa Möte</h2>

            <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Titel</label>
                    <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Beskrivning</label>
                    <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Startdatum</label>
                        <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Slutdatum</label>
                        <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded px-3 py-2" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Pris</label>
                        <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border rounded px-3 py-2" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input id="lodgeMeeting" type="checkbox" checked={form.lodgeMeeting} onChange={(e) => setForm({ ...form, lodgeMeeting: e.target.checked })} />
                        <label htmlFor="lodgeMeeting" className="text-sm">Logemöte</label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Associera loger</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto p-2 border rounded bg-gray-50">
                        {lodges.map((l) => (
                            <label key={l.id} className="flex items-center gap-2">
                                <input type="checkbox" checked={selectedLodgeIds.includes(l.id)} onChange={(e) => {
                                    if (e.target.checked) setSelectedLodgeIds((s) => Array.from(new Set([...s, l.id])));
                                    else setSelectedLodgeIds((s) => s.filter((id) => id !== l.id));
                                }} />
                                <span className="text-sm">{l.name}</span>
                            </label>
                        ))}
                        {lodges.length === 0 && <div className="text-sm text-gray-500">Inga loger</div>}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={saving}>{saving ? "Skapar…" : "Skapa"}</button>
                    <Link to="/events" className="px-4 py-2 rounded border">Avbryt</Link>
                </div>
            </form>
        </div>
    );
};