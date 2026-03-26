import type { PublicUser } from "../types";
import { AudienceSelection } from "./AudienceSelection";
import { normalizeSelectionIds } from "./lodgeSelectionUtils";

export type UserSelectionProps = {
  users?: PublicUser[] | null;
  selectedIds?: Array<string | number> | null;
  derivedSelectedIds?: Array<string | number> | null;
  onChange: (ids: string[]) => void;
  label?: string;
  name?: string;
  disabled?: boolean;
  emptyLabel?: string;
  loading?: boolean;
};

export function UserSelection({
  users,
  selectedIds,
  derivedSelectedIds,
  onChange,
  label = "Välj användare",
  name = "user-selection",
  disabled = false,
  emptyLabel = "Inga användare",
  loading = false,
}: UserSelectionProps) {
  const explicitIds = normalizeSelectionIds(selectedIds);
  const derivedIds = normalizeSelectionIds(derivedSelectedIds);
  const mergedSelectedIds = Array.from(new Set([...explicitIds, ...derivedIds]));

  return (
    <AudienceSelection
      items={(users ?? []).map((user) => {
        const isReadOnly =
          derivedIds.includes(String(user.matrikelnummer)) &&
          !explicitIds.includes(String(user.matrikelnummer));

        return {
          id: user.matrikelnummer,
          label: `${user.firstname} ${user.lastname}`,
          note: isReadOnly ? "via annat val" : null,
          readOnly: isReadOnly,
        };
      })}
      selectedIds={mergedSelectedIds}
      onChange={onChange}
      label={label}
      name={name}
      disabled={disabled}
      emptyLabel={emptyLabel}
      loading={loading}
    />
  );
}

export default UserSelection;
