export type ApiErrorDetails = {
  fields?: Record<string, string>;
  [key: string]: unknown;
};

export type ApiError = {
  status: number;
  code?: string;
  message?: string;
  details?: ApiErrorDetails | unknown;
};

export function isApiError(v: unknown): v is ApiError {
  return (
    typeof v === "object" &&
    v !== null &&
    "message" in v &&
    typeof (v as { message: unknown }).message === "string"
  );
}
