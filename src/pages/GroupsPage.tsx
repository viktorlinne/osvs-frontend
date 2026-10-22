import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  AsyncState,
  Button,
  GroupForm,
  PageContainer,
  inputClass,
  labelClass,
} from "../components";
import useFetch from "../hooks/useFetch";
import { createGroup, listGroups } from "../services/groups";
import type { Group } from "../types";
import { SkeletonBlock } from "../components/PageSkeleton";

function formatMemberCount(count: number) {
  return count === 1 ? "1 medlem" : `${count} medlemmar`;
}

export const GroupsPage = () => {
  const navigate = useNavigate();
  const { run, data: groups, loading } = useFetch<Group[]>();
  const [fetchError, setFetchError] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setFetchError(false);
    run(() => listGroups()).catch(() => setFetchError(true));
  }, [run]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleCreate(values: { name: string; description: string | null }) {
    const group = await createGroup(values);
    toast.success(`Gruppen ”${group.name}” har skapats.`);
    navigate(`/admin/groups/${group.id}`);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = (groups ?? []).filter((group) =>
    group.name.toLowerCase().includes(normalizedQuery),
  );
  const isFiltered = normalizedQuery.length > 0;

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="ui-page-title">Grupper</h1>
        {!creating ? (
          <Button type="button" onClick={() => setCreating(true)}>
            Ny grupp
          </Button>
        ) : null}
      </div>

      {creating ? (
        <section className="mb-8" aria-labelledby="create-group-heading">
          <h2 id="create-group-heading" className="mb-3 text-lg font-semibold text-neutral-900">
            Skapa grupp
          </h2>
          <GroupForm
            idPrefix="create-group"
            submitLabel="Skapa"
            submittingLabel="Skapar…"
            fallbackErrorMessage="Kunde inte skapa gruppen."
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </section>
      ) : null}

      <div className="mb-6">
        <label className={labelClass} htmlFor="groupSearch">
          Sök på namn
          <input
            id="groupSearch"
            name="groupSearch"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök grupp"
            className={inputClass}
          />
        </label>
      </div>

      <AsyncState
        loading={loading}
        error={fetchError}
        errorMessage="Grupperna kunde inte laddas."
        onRetry={load}
        loadingFallback={
          <div
            className="overflow-hidden rounded-card border border-neutral-200"
            aria-busy="true"
            aria-label="Laddar grupper"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-b border-neutral-200 px-5 py-3.5 last:border-b-0"
                aria-hidden="true"
              >
                <SkeletonBlock className="h-5 w-2/3" />
              </div>
            ))}
          </div>
        }
      >
        {filtered.length > 0 ? (
          <ul className="animate-step-in overflow-hidden rounded-card border border-neutral-200">
            {filtered.map((group) => (
              <li key={group.id} className="border-b border-neutral-200 last:border-b-0">
                <Link
                  to={`/admin/groups/${group.id}`}
                  className="flex items-center justify-between gap-3 bg-white px-5 py-3.5 transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold leading-snug tracking-tight text-neutral-900">
                      {group.name}
                    </span>
                    {group.description ? (
                      <span className="block truncate text-sm text-neutral-600">
                        {group.description}
                      </span>
                    ) : null}
                  </span>
                  <span className="ui-chapter shrink-0">
                    {formatMemberCount(group.memberCount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="my-12 flex flex-col items-center gap-3 text-center">
            <span className="ui-chapter" aria-hidden="true">
              {isFiltered ? "Inga resultat" : "Inga grupper"}
            </span>
            <p className="text-neutral-600">
              {isFiltered
                ? "Inga grupper matchade sökningen."
                : "Det finns inga grupper ännu. Skapa en grupp för att kunna skicka utskick till flera medlemmar på en gång."}
            </p>
            {isFiltered ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="ui-btn ui-btn-secondary mt-1"
              >
                Rensa sökning
              </button>
            ) : !creating ? (
              <Button type="button" className="mt-1" onClick={() => setCreating(true)}>
                Skapa grupp
              </Button>
            ) : null}
          </div>
        )}
      </AsyncState>
    </PageContainer>
  );
};
