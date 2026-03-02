export function validateRequiredTitle(title: string): string | null {
  if (!title.trim()) return "Titel är obligatorisk";
  return null;
}

export function validatePdfFile(file: File | null): string | null {
  if (!file) return "Välj en PDF-fil";
  const lowerName = file.name.toLowerCase();
  const isPdfMime = file.type === "application/pdf";
  const isPdfExt = lowerName.endsWith(".pdf");
  if (!isPdfMime && !isPdfExt) return "Filen måste vara en PDF";
  return null;
}

export function buildPdfFormData(
  fields: Record<string, string>,
  file: File,
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  formData.append("file", file);
  return formData;
}
