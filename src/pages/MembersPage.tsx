import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, PageContainer, inputClass, selectClass } from "../components";
import { useAuth } from "../context";
import useFetch from "../hooks/useFetch";
import { listAchievements } from "../services/achievements";
import { listLodges } from "../services/lodges";
import { listOfficials } from "../services/officials";
import {
  listUsersPage as listUsersService,
  type PaginatedUsersResponse,
} from "../services/users";
import type { PublicUser } from "../types";

const MEMBERS_PAGE_SIZE = 24;

export const MembersPage = () => {
  const { run, data: membersPage, loading } =
    useFetch<PaginatedUsersResponse>();
  const { run: runAchievements, data: achievements } =
    useFetch<Array<{ id: number; title: string }>>();
  const { run: runLodges, data: lodges } =
    useFetch<Array<{ id: number; name: string }>>();
  const { run: runOfficials, data: officials } =
    useFetch<Array<{ id: number; title: string }>>();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [achievementId, setAchievementId] = useState<number | null>(null);
  const [lodgeId, setLodgeId] = useState<number | null>(null);
  const [officialId, setOfficialId] = useState<number | null>(null);
  const [accommodationOnly, setAccommodationOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    runAchievements(() => listAchievements()).catch(() => {
      // handled by useFetch
    });
    runLodges(() => listLodges()).catch(() => {
      // handled by useFetch
    });
    runOfficials(() => listOfficials()).catch(() => {
      // handled by useFetch
    });
  }, [runAchievements, runLodges, runOfficials]);

  const doFetch = useCallback(
    () =>
      run(() =>
        listUsersService({
          name: debouncedQuery || undefined,
          achievementId,
          lodgeId,
          officialId,
          accommodationAvailable: accommodationOnly ? true : null,
          page,
          pageSize: MEMBERS_PAGE_SIZE,
        }),
      ),
    [
      run,
      debouncedQuery,
      achievementId,
      lodgeId,
      officialId,
      accommodationOnly,
      page,
    ],
  );

  useEffect(() => {
    doFetch().catch(() => {
      // handled by useFetch
    });
  }, [doFetch]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const members = membersPage?.users ?? [];
  const total = membersPage?.total ?? 0;
  const totalPages = membersPage?.totalPages ?? 0;
  const currentPageSize = membersPage?.pageSize ?? MEMBERS_PAGE_SIZE;
  const from = total === 0 ? 0 : (page - 1) * currentPageSize + 1;
  const to = total === 0 ? 0 : Math.min(page * currentPageSize, total);

  function handleAchievementChange(value: string) {
    setAchievementId(value ? Number(value) : null);
    setPage(1);
  }

  function handleLodgeChange(value: string) {
    setLodgeId(value ? Number(value) : null);
    setPage(1);
  }

  function handleOfficialChange(value: string) {
    setOfficialId(value ? Number(value) : null);
    setPage(1);
  }

  function handleAccommodationChange(checked: boolean) {
    setAccommodationOnly(checked);
    setPage(1);
  }

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="ui-page-title">Medlemmar</h2>
        {user &&
          (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)) && (
            <Link to="/members/create" className="ui-btn ui-btn-primary">
              Skapa
            </Link>
          )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input
          id="search"
          name="search"
          type="search"
          placeholder="Sök..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={inputClass}
        />
        <select
          id="achievementFilter"
          name="achievementFilter"
          value={achievementId ?? ""}
          onChange={(e) => handleAchievementChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Alla grader</option>
          {(achievements ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
        <select
          id="lodgeFilter"
          name="lodgeFilter"
          value={lodgeId ?? ""}
          onChange={(e) => handleLodgeChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Alla loger</option>
          {(lodges ?? []).map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          id="officialFilter"
          name="officialFilter"
          value={officialId ?? ""}
          onChange={(e) => handleOfficialChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Alla tjänster</option>
          {(officials ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
        <label
          htmlFor="accommodationFilter"
          className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
        >
          <input
            id="accommodationFilter"
            name="accommodationFilter"
            type="checkbox"
            checked={accommodationOnly}
            onChange={(event) => handleAccommodationChange(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
          />
          <span>Tillgängligt boende</span>
        </label>
      </div>

      {!loading ? (
        <div className="mb-4 flex flex-col gap-2 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {total > 0
              ? `Visar ${from}-${to} av ${total} medlemmar`
              : "Inga medlemmar hittades"}
          </span>
          {totalPages > 1 ? <span>{`Sida ${page} av ${totalPages}`}</span> : null}
        </div>
      ) : null}

      {loading ? (
        <div className="ui-card text-neutral-600">Laddar medlemmar...</div>
      ) : members.length === 0 ? (
        <div className="ui-card text-neutral-600">
          Ingen medlem matchar de valda filtren.
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member: PublicUser) => (
            <Link
              to={`/members/${member.matrikelnummer}`}
              key={member.matrikelnummer}
              className="ui-card ui-card-hover flex items-center gap-4"
            >
              <img
                src={member.pictureUrl}
                alt={`${member.firstname} ${member.lastname}`}
                className="h-16 w-16 shrink-0 rounded-full object-cover object-top ring-2 ring-neutral-100"
                loading="lazy"
                decoding="async"
              />
              <div className="min-w-0">
                <div className="truncate font-semibold text-neutral-900">
                  {member.firstname} {member.lastname}
                </div>
                <div className="truncate text-sm text-neutral-600">
                  {member.email}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-600">{`Sida ${page} av ${totalPages}`}</div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Föregående
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Nästa
            </Button>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
};
