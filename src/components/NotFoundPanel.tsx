import { Link } from "react-router-dom";

type NotFoundPanelProps = {
  title: string;
  description: string;
  backTo: string;
  backLabel: string;
};

export function NotFoundPanel({
  title,
  description,
  backTo,
  backLabel,
}: NotFoundPanelProps) {
  return (
    <div className="ui-card flex flex-col items-center gap-3 py-10 text-center">
      <h1 className="ui-page-title">{title}</h1>
      <p className="text-sm text-neutral-600">{description}</p>
      <Link to={backTo} className="ui-btn ui-btn-primary mt-2">
        {backLabel}
      </Link>
    </div>
  );
}

export default NotFoundPanel;
