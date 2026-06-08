import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

type ImageFileInputProps = {
  id?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  hint?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageIcon({ className }: { className?: string }) {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 15-4.5-4.5a1 1 0 0 0-1.4 0L9 17" />
      <path d="m13 17 2.5-2.5a1 1 0 0 1 1.4 0L19 16.6" />
    </svg>
  );
}

export function ImageFileInput({
  id = "image-file-input",
  value,
  onChange,
  error,
  hint,
}: ImageFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    onChange(files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
    event.target.value = "";
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

  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="sr-only"
        onChange={handleChange}
        aria-describedby={describedBy}
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
              <ImageIcon className="h-6 w-6 shrink-0 text-neutral-400" />
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
              Byt bild
            </button>
          </div>
        ) : (
          <div className="animate-step-in py-7 text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Bild - max 5 MB
            </p>
            <button
              type="button"
              onClick={openPicker}
              className="ui-btn ui-btn-secondary ui-btn-sm mt-3 tracking-normal"
            >
              Valj bild
            </button>
            <p className="mt-2 text-xs text-neutral-400">eller dra hit</p>
          </div>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="ui-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
