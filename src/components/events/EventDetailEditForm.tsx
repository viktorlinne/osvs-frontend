import { Link } from "react-router-dom";
import type { Lodge } from "../../types";
import { Button, errorTextClass } from "../ui";

export type EventFormState = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  price: string;
  lodgeMeeting: boolean;
};

type Props = {
  form: EventFormState;
  setForm: React.Dispatch<React.SetStateAction<EventFormState>>;
  lodges: Lodge[] | null | undefined;
  linkedIds: number[];
  setLinkedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onSave: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  isAdmin: boolean;
  saving: boolean;
  errors: Record<string, string>;
  canSubmit: boolean;
  clearServerField: (field: string) => void;
};

export function EventDetailEditForm({
  form,
  setForm,
  lodges,
  linkedIds,
  setLinkedIds,
  onSave,
  onDelete,
  isAdmin,
  saving,
  errors,
  canSubmit,
  clearServerField,
}: Props) {
  const foodPreview =
    Number.isFinite(Number(form.price)) && Number(form.price) > 0 ? 1 : 0;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="ui-label">
          Titel
        </label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={(e) => {
            clearServerField("title");
            setForm({ ...form, title: e.target.value });
          }}
          className="ui-input"
        />
        {errors.title ? <p className={errorTextClass}>{errors.title}</p> : null}
      </div>

      <div>
        <label className="ui-label">Kopplade loger</label>
        <div className="grid max-h-40 grid-cols-1 gap-2 overflow-auto rounded-md border border-neutral-200 p-2 sm:grid-cols-2">
          {Array.isArray(lodges) && lodges.length > 0 ? (
            lodges.map((l) => (
              <label
                key={l.id}
                className="inline-flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700"
              >
                <input
                  type="checkbox"
                  checked={linkedIds.includes(l.id)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                  onChange={(e) => {
                    clearServerField("lodgeId");
                    clearServerField("lodgeIds");
                    const checked = e.target.checked;
                    setLinkedIds((prev) =>
                      checked
                        ? Array.from(new Set([...prev, l.id]))
                        : prev.filter((x) => x !== l.id),
                    );
                  }}
                />
                <span>{l.name}</span>
              </label>
            ))
          ) : (
            <div className="text-sm text-neutral-600">Inga loger att välja</div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="ui-label">
          Beskrivning
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={(e) => {
            clearServerField("description");
            setForm({ ...form, description: e.target.value });
          }}
          className="ui-textarea"
        />
        {errors.description ? (
          <p className={errorTextClass}>{errors.description}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="ui-label">
            Startdatum
          </label>
          <input
            type="datetime-local"
            id="startDate"
            name="startDate"
            value={form.startDate}
            onChange={(e) => {
              clearServerField("startDate");
              setForm({ ...form, startDate: e.target.value });
            }}
            className="ui-input"
          />
          {errors.startDate ? (
            <p className={errorTextClass}>{errors.startDate}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="endDate" className="ui-label">
            Slutdatum
          </label>
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            value={form.endDate}
            onChange={(e) => {
              clearServerField("endDate");
              setForm({ ...form, endDate: e.target.value });
            }}
            className="ui-input"
          />
          {errors.endDate ? (
            <p className={errorTextClass}>{errors.endDate}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="price" className="ui-label">
            Pris
          </label>
          <input
            id="price"
            name="price"
            value={form.price}
            onChange={(e) => {
              clearServerField("price");
              setForm({ ...form, price: e.target.value });
            }}
            className="ui-input"
          />
          {errors.price ? <p className={errorTextClass}>{errors.price}</p> : null}
        </div>
        <div>
          <label htmlFor="foodPreview" className="ui-label">
            Mat (auto)
          </label>
          <input
            id="foodPreview"
            name="foodPreview"
            value={String(foodPreview)}
            className="ui-input bg-neutral-100"
            readOnly
          />
        </div>
        <label
          htmlFor="lodgeMeeting"
          className="mt-2 inline-flex items-center gap-2 text-sm text-neutral-700"
        >
          <input
            id="lodgeMeeting"
            type="checkbox"
            checked={form.lodgeMeeting}
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
            onChange={(e) => {
              clearServerField("lodgeMeeting");
              setForm({ ...form, lodgeMeeting: e.target.checked });
            }}
          />
          Logemöte
        </label>
      </div>

      <div className="flex flex-col gap-2 py-2 sm:flex-row">
        <Button
          className="ui-btn-primary"
          onClick={onSave}
          disabled={saving || !canSubmit}
        >
          {saving ? "Sparar..." : "Spara"}
        </Button>
        {isAdmin && onDelete && (
          <Button
            className="ui-btn-danger"
            onClick={onDelete}
            disabled={saving}
          >
            Radera
          </Button>
        )}
        <Button className="ui-btn-secondary">
          <Link to=".." relative="path">
            Avbryt
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default EventDetailEditForm;
