import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components";
import { useAuth } from "../context";
import useFetch from "../hooks/useFetch";
import { listDocuments } from "../services";
import type { SiteDocument } from "../types";

export const DocumentsPage = () => {
  const { user } = useAuth();
  const canCreate = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );
  const { run, data: documents, loading } = useFetch<SiteDocument[]>();

  useEffect(() => {
    run(() => listDocuments()).catch(() => {
      // handled by useFetch
    });
  }, [run]);

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ui-page-title">Dokument</h2>
        {canCreate && (
          <Link to="/documents/create" className="ui-btn ui-btn-primary">
            LÃ¤gg till dokument
          </Link>
        )}
      </div>

      <div className="grid w-full gap-4">
        {(documents ?? []).map((document) => (
          <a
            key={document.id}
            href={document.pictureUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="ui-card ui-card-hover block"
          >
            <div className="text-lg font-semibold text-neutral-900">{document.title}</div>
          </a>
        ))}
      </div>

      {!loading && (documents ?? []).length === 0 && (
        <p className="mt-6 text-neutral-600">Inga dokument hittades.</p>
      )}
    </PageContainer>
  );
};
