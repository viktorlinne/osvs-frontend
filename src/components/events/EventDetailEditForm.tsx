import { Link } from "react-router-dom";
import type { Lodge } from "../../types";

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
  saving: boolean;
  cancelTo: string;
};

export function EventDetailEditForm({
  form,
  setForm,
  lodges,
  linkedIds,
  setLinkedIds,
  onSave,
  saving,
  cancelTo,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Titel
        </label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Kopplade loger</label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto border rounded-md p-2">
          {Array.isArray(lodges) && lodges.length > 0 ? (
            lodges.map((l) => (
              <label key={l.id} className="flex items-center gap-x-2">
                <input
                  type="checkbox"
                  checked={linkedIds.includes(l.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setLinkedIds((prev) =>
                      checked
                        ? Array.from(new Set([...prev, l.id]))
                        : prev.filter((x) => x !== l.id),
                    );
                  }}
                />
                <span className="text-sm">{l.name}</span>
              </label>
            ))
          ) : (
            <div className="text-sm text-gray-500">Inga loger att välja</div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Beskrivning
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border rounded-md px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">
            Startdatum
          </label>
          <input
            type="datetime-local"
            id="startDate"
            name="startDate"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">
            Slutdatum
          </label>
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Pris
          </label>
          <input
            id="price"
            name="price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div className="flex items-center gap-x-4 py-2">
          <input
            id="lodgeMeeting"
            type="checkbox"
            checked={form.lodgeMeeting}
            onChange={(e) => setForm({ ...form, lodgeMeeting: e.target.checked })}
          />
          <label htmlFor="lodgeMeeting" className="text-sm">
            Logemöte
          </label>
        </div>
      </div>

      <div className="flex gap-x-4 py-2">
        <button
          className="bg-green-600 hover:bg-green-700 text-sm font-medium transition text-white px-4 py-2 rounded-md"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Sparar…" : "Spara"}
        </button>
        <Link
          to={cancelTo}
          className="bg-gray-100 hover:bg-gray-200 transition px-4 py-2 rounded-md border"
        >
          Avbryt
        </Link>
      </div>
    </div>
  );
}

export default EventDetailEditForm;

