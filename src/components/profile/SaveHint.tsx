/** Why a profile/member "Spara" button is disabled (invalid or unchanged). */
export function SaveHint({
  saving,
  isValid,
  hasChanges,
}: {
  saving: boolean;
  isValid: boolean;
  hasChanges: boolean;
}) {
  if (saving) return null;
  if (!isValid) {
    return (
      <p className="text-sm text-neutral-600 sm:self-center">
        Rätta de markerade fälten för att kunna spara.
      </p>
    );
  }
  if (!hasChanges) {
    return (
      <p className="text-sm text-neutral-500 sm:self-center">Inga ändringar</p>
    );
  }
  return null;
}

export default SaveHint;
