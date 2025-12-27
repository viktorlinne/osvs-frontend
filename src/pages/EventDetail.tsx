import { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { Spinner, NotFound } from "../components";
import useFetch from "../hooks/useFetch";
import { useError, useAuth } from "../context";
import type { events as EventRecord, lodges as Lodge } from "@osvs/types";
import { getEvent, updateEvent, listEventLodges, linkLodgeEvent, unlinkLodgeEvent } from "../services";
import { createEventPayment } from "../services/stripe";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeForm from "../components/StripeForm";
import { listLodges } from "../services/lodges";
import { getRsvp, setRsvp, getEventStats } from "../services/events";

function formatDisplayDate(s?: string) {
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return String(s);
    const parts = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", year: "numeric" }).formatToParts(d);
    return parts.map((p) => p.type === "month" ? (p.value.charAt(0).toUpperCase() + p.value.slice(1)) : p.value).join("");
}

function toDateInputValue(s?: string) {
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return String(s).slice(0, 10);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function EventDetail() {
    const { id } = useParams<{ id: string }>();
    const { run, loading, data: event, notFound } = useFetch<EventRecord | null>();
    const { setError: setGlobalError, clearError: clearGlobalError } = useError();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const isEditRoute = location.pathname.endsWith("/edit");
    const canEdit = Boolean(user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)));

    const [saving, setSaving] = useState(false);
    const [rsvp, setRsvpState] = useState<string | null>(null);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [stats, setStats] = useState<{ invited: number; answered: number; going: number } | null>(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        price: "",
        lodgeMeeting: false,
    });
    const [lodges, setLodges] = useState<Array<{ id: number; name: string }>>([]);
    const [selectedLodgeIds, setSelectedLodgeIds] = useState<number[]>([]);
    const [originalLinkedIds, setOriginalLinkedIds] = useState<number[]>([]);
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [eventPayment, setEventPayment] = useState<Record<string, unknown> | null>(null);
    const rawPaymentStatus = eventPayment ? (eventPayment as Record<string, unknown>)['status'] : undefined;
    const paymentStatus = typeof rawPaymentStatus === 'string' ? rawPaymentStatus : undefined;

    const stripePromise = (typeof window !== "undefined" && (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)) ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) : null;
    const eventPriceValue = (() => {
        if (!event) return 0;
        const raw = (event as unknown as Record<string, unknown>)['price'];
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'string' && raw.trim() !== '') {
            const n = Number(raw);
            return Number.isFinite(n) ? n : 0;
        }
        return 0;
    })();

    useEffect(() => {
        if (!id) return setGlobalError("Missing event id");
        run(async () => {
            const resp = await getEvent(id);
            // service returns { event }
            const ev = (resp as { event?: EventRecord })?.event ?? null;
            return ev as EventRecord | null;
        }).catch(() => { /* ignore - useFetch sets global error */ });
    }, [id, run, setGlobalError]);

    // initialize form whenever the event changes or when entering edit mode
    useEffect(() => {
        if (!event) return;
        setForm({
            title: event.title ?? "",
            description: event.description ?? "",
            startDate: toDateInputValue(event.startDate),
            endDate: toDateInputValue(event.endDate),
            price: event.price != null ? String(event.price) : "",
            lodgeMeeting: Boolean(event.lodgeMeeting),
        });
    }, [event, isEditRoute]);

    // load lodges and which are linked to this event when editing
    useEffect(() => {
        if (!event) return;
        let mounted = true;
        (async () => {
            try {
                const all = await listLodges();
                const linkedResp = await listEventLodges(event.id as unknown as number);
                // load current user's payment for this event (single fetch)
                try {
                    if (user) {
                        const p = await createEventPayment(event.id as unknown as number);
                        const paymentRow = (p as Record<string, unknown>)?.payment ?? p ?? null;
                        if (!mounted) return;
                        setEventPayment(paymentRow as Record<string, unknown> | null);
                    } else {
                        // not logged in — no payment to check
                        setEventPayment(null);
                    }
                } catch {
                    // ignore — show pay UI if check fails
                }
                const linked = (linkedResp as { lodges?: Lodge[] })?.lodges ?? linkedResp ?? [];
                if (!mounted) return;
                setLodges(Array.isArray(all) ? all : []);
                const linkedIds = Array.isArray(linked) ? linked.map((l: Lodge) => Number(l.id)).filter((n: number) => Number.isFinite(n)) : [];
                setSelectedLodgeIds(linkedIds);
                setOriginalLinkedIds(linkedIds);
                // fetch RSVP for this event
                try {
                    const r = await getRsvp(event.id as unknown as number);
                    const val = (r as { rsvp?: string | null })?.rsvp ?? null;
                    if (!mounted) return;
                    // backend returns 'going' | 'not-going' | null; map to local values
                    if (val === "going") setRsvpState("yes");
                    else if (val === "not-going") setRsvpState("no");
                    else setRsvpState(null);
                } catch {
                    // ignore RSVP errors
                }
                // no automatic fetching of payment state here
                // fetch admin stats
                try {
                    if (user && Array.isArray(user.roles) && user.roles.includes("Admin")) {
                        const s = await getEventStats(event.id as unknown as number);
                        // getEventStats may return either { stats: { ... } } or the stats object directly; handle both explicitly
                        type Stats = { invited: number; answered: number; going: number };
                        const response = s as { stats?: Stats } | Stats | null | undefined;
                        let st: Stats | null = null;
                        if (response && "stats" in response && response.stats) {
                            st = response.stats;
                        } else if (response && "invited" in response && "answered" in response && "going" in response) {
                            st = response as Stats;
                        }
                        if (mounted && st) setStats(st as { invited: number; answered: number; going: number });
                    }
                } catch {
                    // ignore stats errors
                }
            } catch {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, [event, user]);

    async function handleSave() {
        if (!id) return setGlobalError("Missing event id");
        clearGlobalError();
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                title: form.title,
                description: form.description,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                price: form.price ? Number(form.price) : undefined,
                lodgeMeeting: form.lodgeMeeting,
            };
            await updateEvent(id, payload);
            // link/unlink lodges according to selection
            const eventId = Number(id);
            if (Number.isFinite(eventId)) {
                const toAdd = selectedLodgeIds.filter((n) => !originalLinkedIds.includes(n));
                const toRemove = originalLinkedIds.filter((n) => !selectedLodgeIds.includes(n));
                await Promise.allSettled([
                    ...toAdd.map((lid) => linkLodgeEvent(eventId, lid)),
                    ...toRemove.map((lid) => unlinkLodgeEvent(eventId, lid)),
                ]);
            }
            // re-fetch and navigate back to view
            await run(async () => {
                const resp = await getEvent(id);
                return (resp as { event?: EventRecord })?.event ?? null;
            });
            navigate(`/events/${id}`);
        } catch {
            setGlobalError("Failed to save event");
        } finally {
            setSaving(false);
        }
    }

    async function handleSetRsvp(status: string) {
        if (!event) return;
        if (!user) return setGlobalError("Du måste vara inloggad för att svara på inbjudningar");
        setRsvpLoading(true);
        clearGlobalError();
        // validate that status is one of the expected values before mapping
        if (status !== "yes" && status !== "no") {
            setGlobalError("Ogiltigt svar");
            setRsvpLoading(false);
            return;
        }
        try {
            // map UI statuses to backend accepted statuses
            const apiStatus: "going" | "not-going" = status === "no" ? "not-going" : "going"; // treat 'yes' as 'going'
            await setRsvp(event.id as unknown as number, apiStatus);
            setRsvpState(status);
        } catch {
            setGlobalError("Det gick inte att uppdatera ditt svar");
        } finally {
            setRsvpLoading(false);
        }
    }

    if (loading) return <Spinner />;
    if (notFound) return <NotFound />;

    return (
        <div className="max-w-3xl w-full mx-auto p-6 min-h-screen">
            <div className="flex items-center justify-between">
                <Link to="/events" className="text-sm text-green-600 underline">← Tillbaka till möten</Link>
                {canEdit && !isEditRoute && (
                    <Link to={`/events/${id}/edit`} className="text-sm text-white bg-green-600 hover:bg-green-700 transition hover:bg-green-700 px-3 py-1 rounded">Edit</Link>
                )}
            </div>

            <h2 className="text-2xl font-bold mt-4 mb-4">Möte</h2>

            {event ? (
                <div className="bg-white p-4 rounded shadow">
                    {isEditRoute && canEdit ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Titel</label>
                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Beskrivning</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Startdatum</label>
                                    <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Slutdatum</label>
                                    <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded px-3 py-2" />
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
                                <button className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded" onClick={handleSave} disabled={saving}>{saving ? "Sparar…" : "Spara"}</button>
                                <Link to={`/events/${id}`} className="bg-gray-100 hover:bg-gray-200 transition px-4 py-2 rounded border">Avbryt</Link>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-2"><strong>Titel:</strong> {event.title}</div>
                            <div className="mb-2"><strong>Beskrivning:</strong> {event.description}</div>
                            <div className="mb-2"><strong>Startdatum:</strong> {formatDisplayDate(event.startDate)}</div>
                            <div className="mb-2"><strong>Slutdatum:</strong> {formatDisplayDate(event.endDate)}</div>
                            <div className="mb-2"><strong>Logemöte:</strong> {event.lodgeMeeting ? "Ja" : "Nej"}</div>
                            <div className="mb-2"><strong>Associerade loger:</strong>
                                {Array.isArray(lodges) && originalLinkedIds.length > 0 ? (
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {lodges
                                            .filter((l) => originalLinkedIds.includes(l.id))
                                            .map((l) => (
                                                <Link key={l.id} to={`/lodges/${l.id}`} className="text-sm text-green-600 underline mr-2">{l.name}</Link>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 mt-1">Inga kopplade loger</div>
                                )}
                            </div>
                            <div className="mb-2"><strong>Mitt Deltagande (RSVP):</strong>
                                <div className="mt-2 flex items-center gap-2">
                                    {user && (
                                        <>
                                            <button
                                                className={`px-3 py-1 rounded ${rsvp === "yes" ? "bg-green-600 hover:bg-green-700 transition text-white" : "bg-gray-100 hover:bg-gray-200 transition"}`}
                                                onClick={() => void handleSetRsvp("yes")}
                                                disabled={rsvpLoading}
                                            >Ja</button>
                                            <button
                                                className={`px-3 py-1 rounded ${rsvp === "no" ? "bg-red-600 hover:bg-red-700 transition text-white" : "bg-gray-100 hover:bg-gray-200 transition"}`}
                                                onClick={() => void handleSetRsvp("no")}
                                                disabled={rsvpLoading}
                                            >Nej</button>
                                            {rsvpLoading && <div className="text-sm text-gray-500 ml-2">Uppdaterar…</div>}
                                        </>
                                    )}
                                </div>
                            </div>
                            {eventPriceValue > 0 && !isEditRoute && (
                                <div className="mt-4">
                                    {paymentStatus === "Paid" ? (
                                        <div className="text-sm text-green-700">Betalt</div>
                                    ) : (
                                        !showCheckout ? (
                                            <button
                                                className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded"
                                                onClick={async () => {
                                                    if (!event || !id) return;
                                                    if (checkoutLoading || showCheckout) return;
                                                    if (paymentStatus === "Paid") return;
                                                    setCheckoutLoading(true);
                                                    try {
                                                        // create (or get existing) payment and PaymentIntent
                                                        const resp = await createEventPayment(id);
                                                        const cs = ((resp as Record<string, unknown>)['client_secret'] as string | undefined) ?? null;
                                                        if (!cs) throw new Error("Missing client_secret from server");
                                                        setClientSecret(cs);
                                                        setShowCheckout(true);
                                                    } catch (err) {
                                                        setGlobalError(String(err));
                                                    } finally {
                                                        setCheckoutLoading(false);
                                                    }
                                                }}
                                                disabled={checkoutLoading}
                                            >
                                                {checkoutLoading ? "Förbereder…" : `Betala (${eventPriceValue} SEK)`}
                                            </button>
                                        ) : null
                                    )
                                    }
                                </div>
                            )}

                            {showCheckout && clientSecret && stripePromise && (!eventPayment || paymentStatus !== "Paid") && (
                                <div className="mt-4 bg-gray-50 p-4 rounded">
                                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                                        <StripeForm onClose={async () => {
                                            setShowCheckout(false);
                                            setClientSecret(null);
                                            if (!event) return;
                                            try {
                                                const p = await createEventPayment(event.id as unknown as number);
                                                const paymentRow = ((p as Record<string, unknown>)['payment'] ?? p) as Record<string, unknown> | null;
                                                setEventPayment(paymentRow);
                                            } catch {
                                                // ignore
                                            }
                                        }} />
                                    </Elements>
                                </div>
                            )}
                            {user && Array.isArray(user.roles) && user.roles.includes("Admin") && stats && (
                                <div className="mb-2"><strong>Totalt Deltagande:</strong>
                                    <div className="mt-1 text-sm text-gray-700">
                                        <div>Inbjudna: {stats.invited}</div>
                                        <div>Svarat: {stats.answered}</div>
                                        <div>Kommer: {stats.going}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-gray-500">Ingen mötesdata</div>
            )}
        </div>
    );
};