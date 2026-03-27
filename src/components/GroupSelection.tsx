import type { Group } from "../types";
import { AudienceSelection } from "./AudienceSelection";
import { normalizeSelectionIds } from "./lodgeSelectionUtils";

export type GroupSelectionProps = {
  groups?: Group[] | null;
  selectedIds?: Array<string | number> | null;
  derivedSelectedIds?: Array<string | number> | null;
  onChange: (ids: string[]) => void;
  label?: string;
  name?: string;
  disabled?: boolean;
  emptyLabel?: string;
  loading?: boolean;
};

export function GroupSelection({
  groups,
  selectedIds,
  derivedSelectedIds,
  onChange,
  label = "Välj grupper",
  name = "group-selection",
  disabled = false,
  emptyLabel = "Inga grupper",
  loading = false,
}: GroupSelectionProps) {
  const explicitIds = normalizeSelectionIds(selectedIds);
  const derivedIds = normalizeSelectionIds(derivedSelectedIds);
  const mergedSelectedIds = Array.from(new Set([...explicitIds, ...derivedIds]));

  return (
    <AudienceSelection
      items={(groups ?? []).map((group) => {
        const isReadOnly =
          derivedIds.includes(String(group.id)) &&
          !explicitIds.includes(String(group.id));

        return {
          id: group.id,
          label: group.name,
          readOnly: isReadOnly,
          note: isReadOnly ? "via logesel" : null,
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

export default GroupSelection;
