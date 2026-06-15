import { Link } from "react-router-dom";
import { PageContainer } from "../components";

export function ForbiddenPage() {
  return (
    <PageContainer size="md" className="ui-page">
      <div className="ui-card flex flex-col items-center gap-3 py-10 text-center">
        <h1 className="ui-page-title">Du har inte behörighet</h1>
        <p className="text-sm text-neutral-600">
          Ditt konto saknar rätt behörighet för att visa den här sidan.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link to="/" className="ui-btn ui-btn-primary">
            Till startsidan
          </Link>
          <Link to="/profile" className="ui-btn ui-btn-secondary">
            Min profil
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

export default ForbiddenPage;
