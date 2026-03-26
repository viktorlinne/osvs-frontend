import { Link } from "react-router-dom";
import type { Group, Lodge, PublicUser } from "../../types";
import { Button, errorTextClass } from "../ui";
import { EventAudienceFields } from "./EventAudienceFields";

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
  groups: Group[] | null | undefined;
  users: PublicUser[] | null | undefined;
  lodgeUsers: PublicUser[] | null | undefined;
  selectedLodgeIds: string[];
  setSelectedLodgeIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedGroupIds: string[];
  setSelectedGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedUserIds: string[];
  setSelectedUserIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  isAdmin: boolean;
  saving: boolean;
  errors: Record<string, string>;
  canSubmit: boolean;
  clearServerField: (field: string) => void;
  lodgesLoading?: boolean;
  groupsLoading?: boolean;
  usersLoading?: boolean;
};

export function EventDetailEditForm({
  form,
  setForm,
  lodges,
  groups,
  users,
  lodgeUsers,
  selectedLodgeIds,
  setSelectedLodgeIds,
  selectedGroupIds,
  setSelectedGroupIds,
  selectedUserIds,
  setSelectedUserIds,
  onSave,
  onDelete,
  isAdmin,
  saving,
  errors,
  canSubmit,
  clearServerField,
  lodgesLoading = false,
  groupsLoading = false,
  usersLoading = false,
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

      <EventAudienceFields
        lodges={lodges}
        groups={groups}
        users={users}
        lodgeUsers={lodgeUsers}
        selectedLodgeIds={selectedLodgeIds}
        selectedGroupIds={selectedGroupIds}
        selectedUserIds={selectedUserIds}
        onLodgeChange={setSelectedLodgeIds}
        onGroupChange={setSelectedGroupIds}
        onUserChange={setSelectedUserIds}
        clearServerField={clearServerField}
        errors={errors}
        disabled={saving}
        lodgesLoading={lodgesLoading}
        groupsLoading={groupsLoading}
        usersLoading={usersLoading}
      />

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
          type="button"
          className="ui-btn-primary"
          onClick={onSave}
          disabled={saving || !canSubmit}
        >
          {saving ? "Sparar..." : "Spara"}
        </Button>
        {isAdmin && onDelete && (
          <Button
            type="button"
            className="ui-btn-danger"
            onClick={onDelete}
            disabled={saving}
          >
            Radera
          </Button>
        )}
        <Link to=".." relative="path" className="ui-btn ui-btn-secondary">
          Avbryt
        </Link>
      </div>
    </div>
  );
}

export default EventDetailEditForm;
