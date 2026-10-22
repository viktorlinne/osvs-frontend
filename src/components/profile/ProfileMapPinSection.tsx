import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import useFetch from "../../hooks/useFetch";
import {
  clearUserLocationOverride,
  listUsersMapPins,
  setUserLocation,
} from "../../services/users";
import type { UserMapPin } from "../../types";
import type { ManualLocationValue } from "../map/ManualLocationPicker";
import { ConfirmDialog } from "../ui/ConfirmDialog";

// Leaflet (~150 kB) is only needed once the member starts editing the pin, so
// the picker is loaded on demand instead of with every page that uses this
// section (or the shared components barrel).
const ManualLocationPicker = lazy(() => import("../map/ManualLocationPicker"));

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

  const handleStartEditing = () => {
    setDraftLocation(existingPin);
    setIsEditing(true);
    setPendingReset(false);
  };

  const handleSave = async () => {
    if (!draftLocation) return;
    try {
      await runAction(() =>
        setUserLocation(userId, { lat: draftLocation.lat, lng: draftLocation.lng }),
      );
      await refreshPin();
      toast.success("Positionen har sparats.");
      setIsEditing(false);
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
      toast.success("Positionen har tagits bort.");
      setIsEditing(false);
    } catch {
      setPendingReset(false);
    }
  };

  return (
    <div className="ui-card mt-4 flex flex-col gap-4">
      <h2 className="ui-chapter">Kartposition</h2>

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

          <Suspense
            fallback={
              <div
                className="flex h-[320px] w-full items-center justify-center rounded-md bg-neutral-100 text-sm text-neutral-600"
                role="status"
              >
                Laddar karta…
              </div>
            }
          >
            <ManualLocationPicker
              value={draftLocation}
              onChange={setDraftLocation}
            />
          </Suspense>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              disabled={actionLoading || !draftLocation}
              onClick={() => {
                void handleSave();
              }}
            >
              {actionLoading && !pendingReset ? "Sparar…" : "Spara position"}
            </button>

            {existingPin !== null && (
              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                disabled={actionLoading}
                onClick={() => setPendingReset(true)}
              >
                Ta bort manuell position
              </button>
            )}

            <ConfirmDialog
              open={pendingReset}
              onOpenChange={setPendingReset}
              title="Ta bort positionen?"
              description="Den manuellt angivna positionen tas bort från medlemskartan."
              confirmLabel="Ta bort"
              pendingLabel="Tar bort…"
              pending={actionLoading}
              onConfirm={() => void handleRemove()}
            />

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
