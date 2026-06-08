import { useCallback, useEffect, useRef, useState } from "react";
import useFetch from "../../hooks/useFetch";
import {
  clearUserLocationOverride,
  listUsersMapPins,
  setUserLocation,
} from "../../services/users";
import type { UserMapPin } from "../../types";
import {
  ManualLocationPicker,
  type ManualLocationValue,
} from "../map/ManualLocationPicker";

type Props = {
  userId: number;
};

export function ProfileMapPinSection({ userId }: Props) {
  const { run: runPins, loading: pinsLoading } = useFetch<UserMapPin[]>();
  const { run: runAction, loading: actionLoading } = useFetch<unknown>();

  const [pinLoaded, setPinLoaded] = useState(false);
  const [existingPin, setExistingPin] = useState<{ lat: number; lng: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLocation, setDraftLocation] = useState<ManualLocationValue>(null);
  const [pendingReset, setPendingReset] = useState(false);
  const [actionStatus, setActionStatus] = useState<"idle" | "saved" | "removed">("idle");
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPin = useCallback(async () => {
    const pins = await runPins(() => listUsersMapPins());
    const mine = (pins ?? []).find((p) => p.id === userId);
    setExistingPin(mine ? { lat: mine.lat, lng: mine.lng } : null);
    setPinLoaded(true);
  }, [runPins, userId]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void refreshPin().catch(() => {
        if (!cancelled) {
          setPinLoaded(true);
        }
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refreshPin]);

  const scheduleStatusReset = useCallback(() => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = setTimeout(() => setActionStatus("idle"), 4000);
  }, []);

  const handleStartEditing = () => {
    setDraftLocation(existingPin);
    setIsEditing(true);
    setActionStatus("idle");
    setPendingReset(false);
  };

  const handleSave = async () => {
    if (!draftLocation) return;
    try {
      await runAction(() =>
        setUserLocation(userId, { lat: draftLocation.lat, lng: draftLocation.lng }),
      );
      await refreshPin();
      setActionStatus("saved");
      setIsEditing(false);
      scheduleStatusReset();
    } catch {
      // surfaced via global error banner
    }
  };

  const handleRemove = async () => {
    try {
      await runAction(() => clearUserLocationOverride(userId));
      setExistingPin(null);
      setDraftLocation(null);
      setPendingReset(false);
      setActionStatus("removed");
      setIsEditing(false);
      scheduleStatusReset();
    } catch {
      setPendingReset(false);
    }
  };

  return (
    <div className="ui-card mt-4 flex flex-col gap-4">
      <h2 className="ui-chapter">Kartposition</h2>

      {actionStatus !== "idle" && (
        <p role="status" className="text-sm font-medium text-success-600">
          {actionStatus === "saved" ? "Position sparad." : "Manuell position borttagen."}
        </p>
      )}

      {!isEditing ? (
        <>
          <p className="text-sm text-neutral-600">
            {pinsLoading && !pinLoaded
              ? "Laddar…"
              : existingPin
                ? "Position registrerad."
                : "Ingen position registrerad."}
          </p>
          <button
            type="button"
            className="ui-btn ui-btn-secondary self-start"
            disabled={!pinLoaded}
            onClick={handleStartEditing}
          >
            {existingPin ? "Ändra position" : "Ange position manuellt"}
          </button>
        </>
      ) : (
        <div className="animate-step-in flex flex-col gap-4">
          <p className="text-sm text-neutral-700">
            Klicka i kartan för att markera positionen.
          </p>

          <ManualLocationPicker
            value={draftLocation}
            onChange={setDraftLocation}
          />

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              disabled={actionLoading || !draftLocation}
              onClick={() => {
                void handleSave();
              }}
            >
              {actionLoading && !pendingReset ? "Sparar..." : "Spara position"}
            </button>

            {existingPin !== null && !pendingReset && (
              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                disabled={actionLoading}
                onClick={() => setPendingReset(true)}
              >
                Ta bort manuell position
              </button>
            )}

            {pendingReset && (
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                <p className="mb-2 text-sm text-neutral-700">
                  Positionen tas bort. Är du säker?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="ui-btn ui-btn-sm ui-btn-danger flex-1"
                    disabled={actionLoading}
                    onClick={() => {
                      void handleRemove();
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
  );
}

export default ProfileMapPinSection;
