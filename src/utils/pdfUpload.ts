const PDF_MAX_SIZE = 5 * 1024 * 1024;

export function validateRequiredTitle(title: string): string | null {
  if (!title.trim()) return "Titel är obligatorisk";
  return null;
}

export function validatePdfFile(
  file: File | null | undefined,
  options?: { required?: boolean },
): string | null {
  const required = options?.required !== false;
  if (!file) return required ? "Fil är obligatorisk" : null;
  if (file.size > PDF_MAX_SIZE) return "Filen får vara högst 5 MB";
  const lowerName = file.name.toLowerCase();
  const isPdfMime = file.type === "application/pdf";
  const isPdfExt = lowerName.endsWith(".pdf");
  if (!isPdfMime && !isPdfExt) return "Endast PDF-filer är tillåtna";
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
