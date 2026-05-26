import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer, inputClass, labelClass } from "../components";
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
  const [titleQuery, setTitleQuery] = useState("");

  useEffect(() => {
    run(() => listDocuments()).catch(() => {
      // handled by useFetch
    });
  }, [run]);

  const filtered = (documents ?? []).filter((d) =>
    d.title.toLowerCase().includes(titleQuery.toLowerCase()),
  );

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ui-page-title">Dokument</h2>
        {canCreate && (
          <Link to="/documents/create" className="ui-btn ui-btn-primary">
            Skapa
          </Link>
        )}
      </div>

      <div className="mb-6">
        <label className={labelClass} htmlFor="titleSearch">
          Sök på titel
          <input
            id="titleSearch"
            name="titleSearch"
            type="search"
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            placeholder="Sök dokumenttitel"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid w-full gap-4">
        {filtered.map((document) => (
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

      {!loading && filtered.length === 0 && (
        <p className="mt-6 text-neutral-600">Inga dokument hittades.</p>
      )}
    </PageContainer>
  );
};
