import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, PageContainer, inputClass, selectClass } from "../components";
import { SkeletonCircle, SkeletonLabel, SkeletonText } from "../components/PageSkeleton";
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
    runAchievements(() => listAchievements()).catch(() => {});
    runLodges(() => listLodges()).catch(() => {});
    runOfficials(() => listOfficials()).catch(() => {});
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
    [run, debouncedQuery, achievementId, lodgeId, officialId, accommodationOnly, page],
  );

  useEffect(() => {
    doFetch().catch(() => {});
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

  const hasActiveFilters = !!(query || achievementId || lodgeId || officialId || accommodationOnly);

  function handleClearFilters() {
    setQuery("");
    setAchievementId(null);
    setLodgeId(null);
    setOfficialId(null);
    setAccommodationOnly(false);
    setPage(1);
  }

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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="ui-page-title">Medlemmar</h2>
        {user &&
          (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)) && (
            <Link to="/members/create" className="ui-btn ui-btn-primary">
              Ny broder
            </Link>
          )}
      </div>

      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <label htmlFor="search" className="sr-only">Sök på namn</label>
          <input
            id="search"
            name="search"
            type="search"
            placeholder="Sök på namn..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={inputClass}
          />
        </div>
        <select
          id="achievementFilter"
          name="achievementFilter"
          aria-label="Filtrera efter grad"
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
          aria-label="Filtrera efter loge"
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
          aria-label="Filtrera efter tjänst"
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
          className="flex min-h-11 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700"
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

      {hasActiveFilters && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Filter aktiva
          </span>
          <button
            type="button"
            onClick={handleClearFilters}
            className="ui-link text-xs"
          >
            Rensa filter
          </button>
        </div>
      )}

      {!loading ? (
        <div
          className="mb-4 text-sm text-neutral-600"
          aria-live="polite"
          aria-atomic="true"
        >
          {total > 0
            ? `Visar ${from}–${to} av ${total} medlemmar`
            : "Inga medlemmar hittades"}
        </div>
      ) : null}

      {loading ? (
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="ui-card flex items-center gap-4">
              <SkeletonCircle className="h-14 w-14 shrink-0" />
              <div className="flex min-w-0 flex-col gap-2">
                <SkeletonText width="w-28" />
                <SkeletonLabel width="w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="ui-card flex flex-col gap-3 text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Ingen broder matchar de valda filtren.</span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="ui-btn ui-btn-secondary ui-btn-sm shrink-0"
            >
              Rensa filter
            </button>
          )}
        </div>
      ) : (
        <div className="animate-step-in grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member: PublicUser) => (
            <MemberCard key={member.matrikelnummer} member={member} />
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

function MemberCard({ member }: { member: PublicUser }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = `${member.firstname[0] ?? ""}${member.lastname[0] ?? ""}`.toUpperCase();
  const subtitle = member.lodgeName ?? member.city ?? null;

  return (
    <Link
      to={`/members/${member.matrikelnummer}`}
      className="ui-card ui-card-hover flex items-center gap-4"
      aria-label={`Visa profil för ${member.firstname} ${member.lastname}`}
    >
      <div className="relative h-14 w-14 shrink-0">
        {!imgFailed && member.pictureUrl ? (
          <img
            src={member.pictureUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover object-top ring-2 ring-primary-100"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 ring-2 ring-primary-100">
            <span className="text-sm font-semibold text-primary-700">{initials}</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold text-neutral-900">
          {member.firstname} {member.lastname}
        </div>
        {subtitle ? (
          <div className="truncate text-xs font-semibold uppercase tracking-widest text-neutral-600">
            {subtitle}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
