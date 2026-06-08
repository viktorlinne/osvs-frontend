import { useRouteError, isRouteErrorResponse, Link } from "react-router";

export function RouteErrorPage() {
  const error = useRouteError();

  let title = "Något gick fel";
  let message = "Ett oväntat fel uppstod. Försök igen eller gå tillbaka till startsidan.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Sidan hittades inte";
      message = "Sidan du letar efter existerar inte.";
    } else {
      title = `Fel ${error.status}`;
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="ui-card w-full max-w-sm text-center">
        <p className="mb-2 text-5xl font-bold text-primary-600">!</p>
        <h2 className="ui-section-title mb-3">{title}</h2>
        <p className="mb-5 text-sm text-neutral-600">{message}</p>
        <div className="flex flex-col gap-2">
          <Link to="/" className="ui-btn ui-btn-primary">
            Gå till startsidan
          </Link>
          <button
            className="ui-btn ui-btn-secondary"
            onClick={() => window.location.reload()}
          >
            Ladda om sidan
          </button>
        </div>
      </div>
    </div>
  );
}
