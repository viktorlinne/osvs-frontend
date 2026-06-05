import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

type PdfFileInputProps = {
  id?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

export function PdfFileInput({
  id = "pdf-file-input",
  value,
  onChange,
  error,
}: PdfFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    onChange(files?.[0] ?? null);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  const zoneClass = [
    "rounded-md border px-4 transition-colors duration-150",
    error
      ? "border-dashed border-danger-400 bg-neutral-50"
      : isDragging
      ? "border-dashed border-primary-500 bg-primary-50"
      : value
      ? "border-neutral-200 bg-white"
      : "border-dashed border-neutral-300 bg-neutral-50",
  ].join(" ");

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={handleChange}
        aria-describedby={error ? `${id}-error` : undefined}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={zoneClass}
        aria-live="polite"
        aria-atomic="true"
      >
        {value ? (
          <div className="animate-step-in flex items-center justify-between gap-3 py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <DocIcon className="h-6 w-6 shrink-0 text-neutral-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {value.name}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {formatFileSize(value.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openPicker}
              className="ui-link shrink-0 text-xs"
            >
              Byt fil
            </button>
          </div>
        ) : (
          <div className="animate-step-in py-7 text-center">
            <DocIcon className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              PDF · max 5 MB
            </p>
            <button
              type="button"
              onClick={openPicker}
              className="ui-btn ui-btn-secondary ui-btn-sm mt-3 tracking-normal"
            >
              Välj fil
            </button>
            <p className="mt-2 text-xs text-neutral-400">eller dra hit</p>
          </div>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className="ui-error">
          {error}
        </p>
      )}
    </div>
  );
}
