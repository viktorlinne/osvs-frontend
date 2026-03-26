import type { Lodge } from "../types";
import { normalizeSelectionIds } from "./lodgeSelectionUtils";
import { AudienceSelection } from "./AudienceSelection";

export type SingleLodgeSelectionProps = {
  lodges?: Lodge[] | null;
  selectedIds?: Array<string | number> | null;
  onChange: (ids: string[]) => void;
  label?: string;
  name?: string;
  disabled?: boolean;
  emptyLabel?: string;
  loading?: boolean;
};

export function SingleLodgeSelection({
  lodges,
  selectedIds,
  onChange,
  label = "Välj loge",
  name = "single-lodge-selection",
  disabled = false,
  emptyLabel = "Inga loger",
  loading = false,
}: SingleLodgeSelectionProps) {
  const normalizedSelected = normalizeSelectionIds(selectedIds);

  return (
    <AudienceSelection
      items={(lodges ?? []).map((lodge) => ({
        id: lodge.id,
        label: lodge.name,
        disabled:
          normalizedSelected.length > 0 &&
          !normalizedSelected.includes(String(lodge.id)),
      }))}
      selectedIds={normalizedSelected}
      onChange={onChange}
      label={label}
      name={name}
      disabled={disabled}
      emptyLabel={emptyLabel}
      loading={loading}
      single
    />
  );
}

export default SingleLodgeSelection;
