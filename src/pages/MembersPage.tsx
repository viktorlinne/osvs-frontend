import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PageContainer,
  inputClass,
  selectClass,
} from "../components";
import { useAuth } from "../context";
import useFetch from "../hooks/useFetch";
import { listAchievements } from "../services/achievements";
import { listLodges } from "../services/lodges";
import { listOfficials } from "../services/officials";
import { listUsers as listUsersService } from "../services/users";
import type { PublicUser } from "../types";

export const MembersPage = () => {
  const { run, data: members } = useFetch<PublicUser[]>();
  const { run: runAchievements, data: achievements } = useFetch<
    Array<{ id: number; title: string }>
  >();
  const { run: runLodges, data: lodges } = useFetch<
    Array<{ id: number; name: string }>
  >();
  const { run: runOfficials, data: officials } = useFetch<
    Array<{ id: number; title: string }>
  >();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [achievementId, setAchievementId] = useState<number | null>(null);
  const [lodgeId, setLodgeId] = useState<number | null>(null);
  const [officialId, setOfficialId] = useState<number | null>(null);
  const [accommodationOnly, setAccommodationOnly] = useState(false);

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
        }),
      ),
    [run, debouncedQuery, achievementId, lodgeId, officialId, accommodationOnly],
  );

  useEffect(() => {
    doFetch().catch(() => {
      // handled by useFetch
    });
  }, [doFetch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 1000);
    return () => clearTimeout(t);
  }, [query]);

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
          onChange={(e) =>
            setAchievementId(e.target.value ? Number(e.target.value) : null)
          }
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
          onChange={(e) =>
            setLodgeId(e.target.value ? Number(e.target.value) : null)
          }
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
          onChange={(e) =>
            setOfficialId(e.target.value ? Number(e.target.value) : null)
          }
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
            onChange={(event) => setAccommodationOnly(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
          />
          <span>Tillgängligt boende</span>
        </label>
      </div>

      {Array.isArray(members) && (
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
                className="h-16 w-16 shrink-0 rounded-full"
              />
              <div className="min-w-0">
                <div className="truncate font-semibold text-neutral-900">
                  {member.firstname} {member.lastname}
                </div>
                <div className="truncate text-sm text-neutral-600">{member.email}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
