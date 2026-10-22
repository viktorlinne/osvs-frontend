import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui";
import { HistoryDialog } from "./HistoryDialog";
import {
  AchievementEntryForm,
  DeleteEntryForm,
  OfficialEntryForm,
} from "./MemberHistoryForms";
import { listOfficials } from "../../services/officials";
import memberHistoryService, {
  type AchievementEntry,
  type AchievementEntryPayload,
  type ChangeLogEntry,
  type ChangeLogValue,
  type MemberHistory,
  type OfficialEntry,
  type OfficialEntryPayload,
} from "../../services/memberHistory";
import type { Achievement, Official } from "../../types";

type DialogState =
  | { kind: "official"; mode: "create" }
  | { kind: "official"; mode: "edit"; entry: OfficialEntry }
  | { kind: "official"; mode: "delete"; entry: OfficialEntry }
  | { kind: "achievement"; mode: "create" }
  | { kind: "achievement"; mode: "edit"; entry: AchievementEntry }
  | { kind: "achievement"; mode: "delete"; entry: AchievementEntry };

type LoadState = "loading" | "error" | "ready";

function day(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function officialPeriod(start: string | null, end: string | null): string {
  return `${day(start) || "?"} – ${end ? day(end) : "pågående"}`;
}

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}

const ACTION_LABEL: Record<ChangeLogEntry["action"], string> = {
  create: "Tillagd",
  update: "Ändrad",
  delete: "Borttagen",
};

const ENTITY_LABEL: Record<ChangeLogEntry["entityType"], string> = {
  official: "Tjänst",
  achievement: "Utmärkelse",
};

function describeValue(
  entityType: ChangeLogEntry["entityType"],
  value: ChangeLogValue | null,
): string {
  if (!value) return "—";
  const title = value.title ?? `#${value.itemId ?? "?"}`;
  return entityType === "official"
    ? `${title}, ${officialPeriod(value.date, value.endDate)}`
    : `${title}, ${day(value.date) || "?"}`;
}

export function ChangeLogList({ entries }: { entries: ChangeLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-neutral-600">Inga ändringar loggade</p>;
  }
  return (
    <ol className="flex flex-col">
      {entries.map((entry) => (
        <li key={entry.id} className="ui-entry text-sm text-neutral-900">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span className="font-medium">
              {ENTITY_LABEL[entry.entityType]} {ACTION_LABEL[entry.action].toLowerCase()}
            </span>
            <span className="shrink-0 text-xs text-neutral-600">
              {entry.createdAt.slice(0, 16).replace("T", " ")}
              {" · "}
              {entry.editorName ??
                (entry.editorId !== null ? `#${entry.editorId}` : "Okänd")}
            </span>
          </div>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-neutral-700">
            {entry.action !== "create" ? (
              <>
                <dt className="text-neutral-600">Före</dt>
                <dd>{describeValue(entry.entityType, entry.oldValue)}</dd>
              </>
            ) : null}
            {entry.action !== "delete" ? (
              <>
                <dt className="text-neutral-600">Efter</dt>
                <dd>{describeValue(entry.entityType, entry.newValue)}</dd>
              </>
            ) : null}
            <dt className="text-neutral-600">Anteckning</dt>
            <dd className="whitespace-pre-wrap">{entry.note ?? "—"}</dd>
          </dl>
        </li>
      ))}
    </ol>
  );
}

export function MemberHistoryEditor({
  matrikelnummer,
  achievementOptions,
  onChanged,
}: {
  matrikelnummer: string;
  achievementOptions: Achievement[];
  /** Called after a successful change (e.g. to refresh the profile header). */
  onChanged?: () => void;
}) {
  const [history, setHistory] = useState<MemberHistory>({
    officials: [],
    achievements: [],
  });
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [officialOptions, setOfficialOptions] = useState<Official[]>([]);
  const [historyState, setHistoryState] = useState<LoadState>("loading");
  const [logState, setLogState] = useState<LoadState>("loading");
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const reload = useCallback(async () => {
    const [historyResult, logResult] = await Promise.allSettled([
      memberHistoryService.getMemberHistory(matrikelnummer),
      memberHistoryService.getMemberChangeLog(matrikelnummer),
    ]);
    if (historyResult.status === "fulfilled") {
      setHistory(historyResult.value);
      setHistoryState("ready");
    } else {
      setHistoryState("error");
    }
    if (logResult.status === "fulfilled") {
      setChangeLog(logResult.value);
      setLogState("ready");
    } else {
      setLogState("error");
    }
  }, [matrikelnummer]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    let mounted = true;
    listOfficials()
      .then((items) => {
        if (mounted) setOfficialOptions(items);
      })
      .catch(() => {
        // Options stay empty; the dialog select then only shows the placeholder.
      });
    return () => {
      mounted = false;
    };
  }, []);

  const closeDialog = useCallback(() => setDialog(null), []);

  async function afterMutation(message: string) {
    toast.success(message);
    setDialog(null);
    await reload();
    onChanged?.();
  }

  async function saveOfficial(payload: OfficialEntryPayload) {
    if (dialog?.kind !== "official") return;
    if (dialog.mode === "edit") {
      await memberHistoryService.updateOfficialEntry(
        matrikelnummer,
        dialog.entry.id,
        payload,
      );
    } else {
      await memberHistoryService.createOfficialEntry(matrikelnummer, payload);
    }
    await afterMutation(
      dialog.mode === "edit" ? "Ändringarna har sparats." : "Tjänsten har lagts till.",
    );
  }

  async function saveAchievement(payload: AchievementEntryPayload) {
    if (dialog?.kind !== "achievement") return;
    if (dialog.mode === "edit") {
      await memberHistoryService.updateAchievementEntry(
        matrikelnummer,
        dialog.entry.id,
        payload,
      );
    } else {
      await memberHistoryService.createAchievementEntry(matrikelnummer, payload);
    }
    await afterMutation(
      dialog.mode === "edit" ? "Ändringarna har sparats." : "Utmärkelsen har lagts till.",
    );
  }

  async function deleteEntry(note: string) {
    if (!dialog || dialog.mode !== "delete") return;
    if (dialog.kind === "official") {
      await memberHistoryService.deleteOfficialEntry(
        matrikelnummer,
        dialog.entry.id,
        note,
      );
    } else {
      await memberHistoryService.deleteAchievementEntry(
        matrikelnummer,
        dialog.entry.id,
        note,
      );
    }
    await afterMutation(
      dialog.kind === "official" ? "Tjänsten har tagits bort." : "Utmärkelsen har tagits bort.",
    );
  }

  function renderDialog() {
    if (!dialog) return null;

    if (dialog.mode === "delete") {
      const description =
        dialog.kind === "official"
          ? `Ta bort tjänsten ${dialog.entry.title} (${officialPeriod(dialog.entry.appointedAt, dialog.entry.unappointedAt)})?`
          : `Ta bort utmärkelsen ${dialog.entry.title} (${day(dialog.entry.awardedAt)})?`;
      return (
        <HistoryDialog
          title={dialog.kind === "official" ? "Ta bort tjänst" : "Ta bort utmärkelse"}
          onClose={closeDialog}
        >
          <DeleteEntryForm
            description={description}
            onSubmit={deleteEntry}
            onCancel={closeDialog}
          />
        </HistoryDialog>
      );
    }

    if (dialog.kind === "official") {
      const entry = dialog.mode === "edit" ? dialog.entry : null;
      return (
        <HistoryDialog
          title={entry ? "Ändra tjänst" : "Lägg till tjänst"}
          onClose={closeDialog}
        >
          <OfficialEntryForm
            mode={dialog.mode}
            initial={{
              officialId: entry?.officialId ?? null,
              appointedAt: entry?.appointedAt ?? "",
              unappointedAt: entry?.unappointedAt ?? null,
            }}
            options={officialOptions}
            onSubmit={saveOfficial}
            onCancel={closeDialog}
          />
        </HistoryDialog>
      );
    }

    const entry = dialog.mode === "edit" ? dialog.entry : null;
    return (
      <HistoryDialog
        title={entry ? "Ändra utmärkelse" : "Lägg till utmärkelse"}
        onClose={closeDialog}
      >
        <AchievementEntryForm
          mode={dialog.mode}
          initial={{
            achievementId: entry?.achievementId ?? null,
            awardedAt: entry?.awardedAt ?? todayIso(),
          }}
          options={achievementOptions}
          onSubmit={saveAchievement}
          onCancel={closeDialog}
        />
      </HistoryDialog>
    );
  }

  const historyStatus =
    historyState === "loading" ? (
      <p className="text-sm text-neutral-600">Laddar…</p>
    ) : historyState === "error" ? (
      <p className="text-sm text-danger-600">Historiken kunde inte laddas.</p>
    ) : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="ui-card flex flex-col gap-3" aria-labelledby="history-officials">
        <div className="flex items-center justify-between gap-2">
          <h2 id="history-officials" className="ui-chapter">Tjänster</h2>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setDialog({ kind: "official", mode: "create" })}
          >
            Lägg till
          </Button>
        </div>
        {historyStatus ??
          (history.officials.length === 0 ? (
            <p className="text-sm text-neutral-600">
              Inga tjänster registrerade. Välj Lägg till för att registrera en tjänst.
            </p>
          ) : (
            <ul className="flex flex-col">
              {history.officials.map((entry) => (
                <li
                  key={entry.id}
                  className="ui-entry flex flex-col gap-2 text-sm text-neutral-900 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p>{entry.title}</p>
                    <p className="text-xs text-neutral-600">
                      {officialPeriod(entry.appointedAt, entry.unappointedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      aria-label={`Ändra tjänst ${entry.title}`}
                      onClick={() =>
                        setDialog({ kind: "official", mode: "edit", entry })
                      }
                    >
                      Ändra
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      aria-label={`Ta bort tjänst ${entry.title}`}
                      onClick={() =>
                        setDialog({ kind: "official", mode: "delete", entry })
                      }
                    >
                      Ta bort
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </section>

      <section className="ui-card flex flex-col gap-3" aria-labelledby="history-achievements">
        <div className="flex items-center justify-between gap-2">
          <h2 id="history-achievements" className="ui-chapter">Utmärkelser</h2>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setDialog({ kind: "achievement", mode: "create" })}
          >
            Lägg till
          </Button>
        </div>
        {historyStatus ??
          (history.achievements.length === 0 ? (
            <p className="text-sm text-neutral-600">
              Inga utmärkelser registrerade. Välj Lägg till för att registrera en utmärkelse.
            </p>
          ) : (
            <ul className="flex flex-col">
              {history.achievements.map((entry) => (
                <li
                  key={entry.id}
                  className="ui-entry flex flex-col gap-2 text-sm text-neutral-900 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p>{entry.title}</p>
                    <p className="text-xs text-neutral-600">{day(entry.awardedAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      aria-label={`Ändra utmärkelse ${entry.title}`}
                      onClick={() =>
                        setDialog({ kind: "achievement", mode: "edit", entry })
                      }
                    >
                      Ändra
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      aria-label={`Ta bort utmärkelse ${entry.title}`}
                      onClick={() =>
                        setDialog({ kind: "achievement", mode: "delete", entry })
                      }
                    >
                      Ta bort
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </section>

      <section
        className="ui-card flex flex-col gap-3 lg:col-span-2"
        aria-labelledby="history-change-log"
      >
        <h2 id="history-change-log" className="ui-chapter">Ändringslogg</h2>
        {logState === "loading" ? (
          <p className="text-sm text-neutral-600">Laddar…</p>
        ) : logState === "error" ? (
          <p className="text-sm text-danger-600">Ändringsloggen kunde inte laddas.</p>
        ) : (
          <ChangeLogList entries={changeLog} />
        )}
      </section>

      {renderDialog()}
    </div>
  );
}

export default MemberHistoryEditor;
