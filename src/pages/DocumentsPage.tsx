import { useEffect } from "react";
import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { listDocuments } from "../services";
import { useAuth } from "../context";
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
    <div className="flex flex-col items-center min-h-screen p-6">
      <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold">Dokument</h2>
        {canCreate && (
          <Link
            to="/documents/create"
            className="flex text-white bg-green-600 hover:bg-green-700 text-sm font-medium transition px-3 py-2 rounded-md"
          >
            Lagg till dokument
          </Link>
        )}
      </div>

      <div className="w-full max-w-3xl grid gap-4">
        {(documents ?? []).map((document) => (
          <a
            key={document.id}
            href={document.pictureUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="block p-4 bg-white rounded-md shadow-md hover:shadow-lg transition"
          >
            <div className="text-lg font-semibold">{document.title}</div>
          </a>
        ))}
      </div>

      {!loading && (documents ?? []).length === 0 && (
        <p className="mt-6 text-gray-600">Inga dokument hittades.</p>
      )}
    </div>
  );
};
