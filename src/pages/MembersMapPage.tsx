import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

const SWEDEN_CENTER: [number, number] = [62.0, 15.0];

const markerIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#16a34a;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const selectedMarkerIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#0ea5e9;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.45)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitToPins({ pins }: { pins: UserMapPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (!pins.length) return;
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

export const MembersMapPage = () => {
  const { user: authUser } = useAuth();

  const { run: runPins, data: pins } = useFetch<UserMapPin[]>();
  const { run: runUsers, data: allUsers } = useFetch<PublicUser[]>();
  const { run: runAction, loading: actionLoading } = useFetch<unknown>();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [draftLocationsByUserId, setDraftLocationsByUserId] = useState<
    Record<number, { lat: number; lng: number }>
  >({});

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

    const ownName = `${String(authUser.firstname ?? "").trim()} ${String(authUser.lastname ?? "").trim()}`.trim();
    return [
      {
        id: Number(authUser.matrikelnummer),
        name: ownName || `#${String(authUser.matrikelnummer)}`,
      },
    ];
  }, [allUsers, authUser, canEditOthers]);

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

  const handleSave = async () => {
    if (effectiveSelectedUserId === null || !currentDraftLocation) return;

    await runAction(() =>
      setUserLocation(effectiveSelectedUserId, {
        lat: currentDraftLocation.lat,
        lng: currentDraftLocation.lng,
      }),
    );

    await refreshPins();
  };

  const handleReset = async () => {
    if (effectiveSelectedUserId === null) return;

    await runAction(() => clearUserLocationOverride(effectiveSelectedUserId));
    setDraftLocationsByUserId((prev) => {
      const next = { ...prev };
      delete next[effectiveSelectedUserId];
      return next;
    });
    await refreshPins();
  };

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="ui-page-title">Medlemskarta</h2>
        <Link to="/members" className="ui-link">
          {"\u2190"} Till Medlemmar
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
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
                icon={pin.id === effectiveSelectedUserId ? selectedMarkerIcon : markerIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedUserId(pin.id);
                  },
                }}
              >
                <Popup>{pin.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="ui-card">
          <label htmlFor="mapTargetUser" className="ui-label">
            Medlem för manuell position
          </label>
          <select
            id="mapTargetUser"
            className={selectClass}
            value={effectiveSelectedUserId ?? ""}
            onChange={(event) =>
              setSelectedUserId(
                event.target.value ? Number(event.target.value) : null,
              )
            }
            disabled={editableUsers.length === 0}
          >
            {editableUsers.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>

          {!canEditOthers ? (
            <p className="mt-2 text-sm text-neutral-600">
              Du kan endast ändra din egen position.
            </p>
          ) : null}

          <div className="mt-4">
            <ManualLocationPicker
              value={currentDraftLocation}
              onChange={setDraftForCurrentUser}
              disabled={effectiveSelectedUserId === null}
            />
          </div>

          <div className="mt-3 text-sm text-neutral-700">
            {currentDraftLocation
              ? `Vald position: ${currentDraftLocation.lat.toFixed(6)}, ${currentDraftLocation.lng.toFixed(6)}`
              : "Klicka i kartan för att välja position"}
          </div>

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
              {actionLoading ? "Sparar..." : "Spara manuell position"}
            </button>

            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              disabled={actionLoading || effectiveSelectedUserId === null}
              onClick={() => {
                void handleReset();
              }}
            >
              Återställ till auto-geokodning
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default MembersMapPage;
