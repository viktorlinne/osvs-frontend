import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Spinner } from "../components";
import useFetch from "../hooks/useFetch";
import type { PublicUser } from "../types";
import { listAchievements } from "../services/achievements";
import { listLodges } from "../services/lodges";

async function fetchMembers({
  name,
  achievementId,
  lodgeId,
}: {
  name?: string;
  achievementId?: number | null;
  lodgeId?: number | null;
}): Promise<PublicUser[]> {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (typeof achievementId !== "undefined" && achievementId !== null)
    params.set("achievementId", String(achievementId));
  if (typeof lodgeId !== "undefined" && lodgeId !== null)
    params.set("lodgeId", String(lodgeId));
  const url =
    `${import.meta.env.VITE_BACKEND_URL}/api/users` +
    (params.toString() ? `?${params.toString()}` : "");
  const resp = await fetch(url, { credentials: "include" });
  if (!resp.ok) throw new Error("Misslyckades att hämta medlemmar");
  const json = await resp.json();
  return (json.users ?? []) as PublicUser[];
}

export const MembersPage = () => {
  const { run, loading, data: members } = useFetch<PublicUser[]>();
  const [query, setQuery] = useState("");
  const [achievementId, setAchievementId] = useState<number | null>(null);
  const [lodgeId, setLodgeId] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<
    Array<{ id: number; title: string }>
  >([]);
  const [lodges, setLodges] = useState<Array<{ id: number; name: string }>>([]);

  // fetch static lists
  useEffect(() => {
    listAchievements()
      .then((list) => setAchievements(list))
      .catch(() => {});
    listLodges()
      .then((list) => setLodges(list))
      .catch(() => {});
  }, []);

  const doFetch = useCallback(
    () =>
      run(() =>
        fetchMembers({ name: query || undefined, achievementId, lodgeId })
      ),
    [run, query, achievementId, lodgeId]
  );

  useEffect(() => {
    doFetch().catch(() => {});
  }, [doFetch]);

  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="max-w-3xl w-full mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Medlemmar</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="search"
            placeholder="Sök förnamn eller efternamn"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <select
            value={achievementId ?? ""}
            onChange={(e) =>
              setAchievementId(e.target.value ? Number(e.target.value) : null)
            }
            className="p-2 border rounded"
          >
            <option value="">Alla grader</option>
            {achievements.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
          <select
            value={lodgeId ?? ""}
            onChange={(e) =>
              setLodgeId(e.target.value ? Number(e.target.value) : null)
            }
            className="p-2 border rounded"
          >
            <option value="">Alla loger</option>
            {lodges.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {loading && <Spinner />}
        {Array.isArray(members) && (
          <div className="grid gap-4">
            {members.map((member: PublicUser) => (
              <Link
                to={`/members/${member.id}`}
                key={member.id}
                className="block p-3 bg-white rounded shadow"
              >
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    member.pictureUrl
                  }`}
                  alt={`${member.firstname} ${member.lastname}`}
                  className="w-16 h-16 rounded-full mb-2"
                />
                <div className="font-semibold">
                  {member.firstname} {member.lastname}
                </div>
                <div className="text-sm text-gray-500">{member.email}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
