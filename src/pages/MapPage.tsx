import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { PageContainer, selectClass } from "../components";
import { useAuth } from "../context";
import useFetch from "../hooks/useFetch";
import {
  clearUserLocationOverride,
  listUsers,
  listUsersMapPins,
  setUserLocation,
} from "../services/users";
import type { PublicUser, UserMapPin } from "../types";
import {
  ManualLocationPicker,
  type ManualLocationValue,
} from "../components/map/ManualLocationPicker";

type EditableUser = {
  id: number;
  name: string;
};

type GradeColorPair = {
  center: string;
  outline: string;
};

const SWEDEN_CENTER: [number, number] = [62.0, 15.0];

const GRADE_COLOR_PALETTE: Record<number, GradeColorPair> = {
  1: { center: "#D0D0C6", outline: "#38826B" },
  2: { center: "#56923C", outline: "#A4690F" },
  3: { center: "#A3A9A5", outline: "#1E2326" },
  4: { center: "#9D2320", outline: "#5B615F" },
  5: { center: "#0C7459", outline: "#928E73" },
  6: { center: "#5A7DA3", outline: "#5A5250" },
  7: { center: "#B13C66", outline: "#9D8D51" },
  8: { center: "#CBC5B7", outline: "#8D784B" },
  9: { center: "#97201C", outline: "#B9A350" },
  10: { center: "#C52C26", outline: "#D7C8CF" },
};

const NO_GRADE_COLOR: GradeColorPair = {
  center: "#b5aa9e",
  outline: "#3c3028",
};

const GRADE_ROMAN_LABELS: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
};

const ICON_CACHE = new Map<string, L.DivIcon>();

function getColorPairByRank(rank: number | null): GradeColorPair {
  if (typeof rank !== "number" || rank < 1 || rank > 10) {
    return NO_GRADE_COLOR;
  }
  return GRADE_COLOR_PALETTE[rank];
}

function toRomanGrade(rank: number | null): string | null {
  if (typeof rank !== "number" || rank < 1 || rank > 10) {
    return null;
  }
  return GRADE_ROMAN_LABELS[rank];
}

function buildMarkerIcon(color: GradeColorPair, selected: boolean): L.DivIcon {
  const glow = selected
    ? '<div style="position:absolute;inset:0;border-radius:9999px;box-shadow:0 0 0 3px rgba(32,143,68,0.45);"></div>'
    : "";
  const html = [
    '<div style="position:relative;width:24px;height:24px;">',
    glow,
    `<div style="position:absolute;inset:${selected ? 4 : 2}px;border-radius:9999px;background:${color.outline};box-shadow:0 1px 4px rgba(28,22,16,0.4);"></div>`,
    `<div style="position:absolute;inset:${selected ? 8 : 6}px;border-radius:9999px;background:${color.center};border:1px solid rgba(255,255,255,0.9);"></div>`,
    "</div>",
  ].join("");

  return L.divIcon({
    className: "",
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function getMarkerIcon(rank: number | null, selected: boolean): L.DivIcon {
  const key = `${rank ?? "none"}:${selected ? "selected" : "default"}`;
  const cached = ICON_CACHE.get(key);
  if (cached) return cached;

  const icon = buildMarkerIcon(getColorPairByRank(rank), selected);
  ICON_CACHE.set(key, icon);
  return icon;
}

function FitToPins({ pins }: { pins: UserMapPin[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!pins.length || fitted.current) return;
    fitted.current = true;
    const bounds = L.latLngBounds(
      pins.map((pin) => [pin.lat, pin.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 9 });
  }, [map, pins]);

  return null;
}

function toEditableUser(user: PublicUser): EditableUser {
  return {
    id: Number(user.matrikelnummer),
    name: `${String(user.firstname ?? "").trim()} ${String(user.lastname ?? "").trim()}`.trim(),
  };
}

export const MapPage = () => {
  const { user: authUser } = useAuth();

  const { run: runPins, data: pins } = useFetch<UserMapPin[]>();
  const { run: runUsers, data: allUsers } = useFetch<PublicUser[]>();
  const { run: runAction, loading: actionLoading } = useFetch<unknown>();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [draftLocationsByUserId, setDraftLocationsByUserId] = useState<
    Record<number, { lat: number; lng: number }>
  >({});
  const [isEditing, setIsEditing] = useState(false);
  const [actionStatus, setActionStatus] = useState<"idle" | "saved" | "removed">("idle");
  const [pendingReset, setPendingReset] = useState(false);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canEditOthers = Boolean(
    authUser &&
      (authUser.roles ?? []).some((role) => role === "Admin" || role === "Editor"),
  );

  const refreshPins = useCallback(
    () => runPins(() => listUsersMapPins()),
    [runPins],
  );

  useEffect(() => {
    refreshPins().catch(() => {
      // handled by useFetch
    });
  }, [refreshPins]);

  useEffect(() => {
    if (!canEditOthers) return;
    runUsers(() => listUsers()).catch(() => {
      // handled by useFetch
    });
  }, [canEditOthers, runUsers]);

  const editableUsers = useMemo((): EditableUser[] => {
    if (canEditOthers) {
      return (allUsers ?? [])
        .map(toEditableUser)
        .filter((entry) => Number.isFinite(entry.id) && entry.name.length > 0);
    }

    if (!authUser) return [];

    const ownName =
      `${String(authUser.firstname ?? "").trim()} ${String(authUser.lastname ?? "").trim()}`.trim();
    return [
      {
        id: Number(authUser.matrikelnummer),
        name: ownName || `#${String(authUser.matrikelnummer)}`,
      },
    ];
  }, [allUsers, authUser, canEditOthers]);

  const gradeLegendItems = useMemo(
    () => [
      { key: "none", label: "Ingen grad", rank: null as number | null },
      ...Object.entries(GRADE_ROMAN_LABELS).map(([rank, label]) => ({
        key: rank,
        label: `Grad ${label}`,
        rank: Number(rank),
      })),
    ],
    [],
  );

  const effectiveSelectedUserId = useMemo(() => {
    if (selectedUserId !== null) return selectedUserId;
    return editableUsers.length > 0 ? editableUsers[0].id : null;
  }, [editableUsers, selectedUserId]);

  const pinByUserId = useMemo(() => {
    return new Map((pins ?? []).map((pin) => [pin.id, pin] as const));
  }, [pins]);

  const currentDraftLocation = useMemo((): ManualLocationValue => {
    if (effectiveSelectedUserId === null) return null;

    const draft = draftLocationsByUserId[effectiveSelectedUserId];
    if (draft && Number.isFinite(draft.lat) && Number.isFinite(draft.lng)) {
      return draft;
    }

    const pin = pinByUserId.get(effectiveSelectedUserId);
    if (!pin) return null;
    return { lat: pin.lat, lng: pin.lng };
  }, [draftLocationsByUserId, effectiveSelectedUserId, pinByUserId]);

  const setDraftForCurrentUser = useCallback(
    (value: { lat: number; lng: number }) => {
      if (effectiveSelectedUserId === null) return;
      setDraftLocationsByUserId((prev) => ({
        ...prev,
        [effectiveSelectedUserId]: value,
      }));
    },
    [effectiveSelectedUserId],
  );

  const scheduleStatusReset = useCallback(() => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = setTimeout(() => setActionStatus("idle"), 4000);
  }, []);

  const handleSave = async () => {
    if (effectiveSelectedUserId === null || !currentDraftLocation) return;
    try {
      await runAction(() =>
        setUserLocation(effectiveSelectedUserId, {
          lat: currentDraftLocation.lat,
          lng: currentDraftLocation.lng,
        }),
      );
      await refreshPins();
      setActionStatus("saved");
      setIsEditing(false);
      scheduleStatusReset();
    } catch {
      // error surfaced via global error banner
    }
  };

  const handleReset = async () => {
    if (effectiveSelectedUserId === null) return;
    try {
      await runAction(() => clearUserLocationOverride(effectiveSelectedUserId));
      setDraftLocationsByUserId((prev) => {
        const next = { ...prev };
        delete next[effectiveSelectedUserId];
        return next;
      });
      await refreshPins();
      setPendingReset(false);
      setActionStatus("removed");
      setIsEditing(false);
      scheduleStatusReset();
    } catch {
      setPendingReset(false);
    }
  };

  const hasExistingPin =
    effectiveSelectedUserId !== null && pinByUserId.has(effectiveSelectedUserId);

  return (
    <PageContainer size="xl" className="ui-page">
      <h2 className="ui-page-title mb-4">Medlemskarta</h2>

      <div className="animate-step-in grid gap-4 lg:grid-cols-3">
        {/* Main map */}
        <div className="ui-card lg:col-span-2">
          <MapContainer
            center={SWEDEN_CENTER}
            zoom={5}
            style={{ height: "560px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitToPins pins={pins ?? []} />

            {(pins ?? []).map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={getMarkerIcon(
                  pin.highestGradeRank,
                  pin.id === effectiveSelectedUserId,
                )}
                eventHandlers={{
                  click: () => {
                    setSelectedUserId(pin.id);
                  },
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{pin.name}</div>
                    <div>{`Tillhör ${pin.lodgeName ?? "Ingen loge"}`}</div>
                    <div>
                      {toRomanGrade(pin.highestGradeRank)
                        ? `Grad ${toRomanGrade(pin.highestGradeRank)}`
                        : "Ingen grad"}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="mt-4">
            <p className="text-sm font-medium text-neutral-700">Gradfärger</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {gradeLegendItems.map((entry) => {
                const color = getColorPairByRank(entry.rank);
                return (
                  <div
                    key={entry.key}
                    className="flex items-center gap-2 text-xs text-neutral-700"
                  >
                    <span
                      aria-hidden
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "9999px",
                        backgroundColor: color.center,
                        border: `3px solid ${color.outline}`,
                        boxShadow: "0 1px 2px rgba(28, 22, 16, 0.2)",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    <span>{entry.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Position controls */}
        <div className="ui-card">
          {canEditOthers && (
            <>
              <label htmlFor="mapTargetUser" className="ui-label">
                Välj broder
              </label>
              <select
                id="mapTargetUser"
                className={selectClass}
                value={effectiveSelectedUserId ?? ""}
                onChange={(event) => {
                  setSelectedUserId(
                    event.target.value ? Number(event.target.value) : null,
                  );
                  setIsEditing(false);
                  setPendingReset(false);
                }}
                disabled={editableUsers.length === 0}
              >
                {editableUsers.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {actionStatus !== "idle" && (
            <p
              role="status"
              className={`text-sm font-medium text-success-600${canEditOthers ? " mt-3" : ""}`}
            >
              {actionStatus === "saved"
                ? "Position sparad."
                : "Manuell position borttagen."}
            </p>
          )}

          {!isEditing ? (
            <div className={canEditOthers ? "mt-4" : actionStatus !== "idle" ? "mt-3" : undefined}>
              <p className="text-sm text-neutral-600">
                {hasExistingPin
                  ? "Position registrerad."
                  : "Ingen position registrerad."}
              </p>
              <button
                type="button"
                className="ui-btn ui-btn-secondary mt-3 w-full"
                disabled={effectiveSelectedUserId === null}
                onClick={() => {
                  setIsEditing(true);
                  setActionStatus("idle");
                  setPendingReset(false);
                }}
              >
                {hasExistingPin ? "Ändra position" : "Ange position manuellt"}
              </button>
            </div>
          ) : (
            <div className={canEditOthers ? "mt-4" : undefined}>
              {!canEditOthers && (
                <p className="mb-3 text-sm text-neutral-600">
                  Du kan endast ändra din egen position.
                </p>
              )}

              <p className="mb-2 text-sm text-neutral-700">
                Klicka i kartan för att markera positionen.
              </p>

              <ManualLocationPicker
                value={currentDraftLocation}
                onChange={setDraftForCurrentUser}
                disabled={effectiveSelectedUserId === null}
              />

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  className="ui-btn ui-btn-primary"
                  disabled={
                    actionLoading ||
                    effectiveSelectedUserId === null ||
                    currentDraftLocation === null
                  }
                  onClick={() => {
                    void handleSave();
                  }}
                >
                  {actionLoading && !pendingReset ? "Sparar..." : "Spara position"}
                </button>

                {!pendingReset ? (
                  <button
                    type="button"
                    className="ui-btn ui-btn-secondary"
                    disabled={actionLoading || effectiveSelectedUserId === null}
                    onClick={() => setPendingReset(true)}
                  >
                    Ta bort manuell position
                  </button>
                ) : (
                  <div className="rounded-md border border-neutral-200 p-3">
                    <p className="mb-2 text-sm text-neutral-700">
                      Positionen tas bort. Är du säker?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="ui-btn ui-btn-sm ui-btn-danger flex-1"
                        disabled={actionLoading}
                        onClick={() => {
                          void handleReset();
                        }}
                      >
                        {actionLoading ? "Tar bort..." : "Bekräfta"}
                      </button>
                      <button
                        type="button"
                        className="ui-btn ui-btn-sm ui-btn-secondary flex-1"
                        disabled={actionLoading}
                        onClick={() => setPendingReset(false)}
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="ui-btn ui-btn-secondary"
                  disabled={actionLoading}
                  onClick={() => {
                    setIsEditing(false);
                    setPendingReset(false);
                  }}
                >
                  Avbryt redigering
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default MapPage;
