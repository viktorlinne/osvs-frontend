import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Spinner } from "../components";
import { useAuth } from "../context";
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
  const { user } = useAuth();
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
      .catch(() => { });
    listLodges()
      .then((list) => setLodges(list))
      .catch(() => { });
  }, []);

  const doFetch = useCallback(
    () =>
      run(() =>
        fetchMembers({ name: query || undefined, achievementId, lodgeId })
      ),
    [run, query, achievementId, lodgeId]
  );

  useEffect(() => {
    doFetch().catch(() => { });
  }, [doFetch]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner /></div>;

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        <h2 className="text-2xl font-bold mb-4">Medlemmar</h2>
        <div className="flex flex-col md:flex-row gap-y-2 md:gap-y-0 md:gap-x-4 py-2 mb-4">
          <input
            type="search"
            placeholder="Sök förnamn eller efternamn"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-md"
          />
          <select
            value={achievementId ?? ""}
            onChange={(e) =>
              setAchievementId(e.target.value ? Number(e.target.value) : null)
            }
            className="px-4 py-2 border rounded-md"
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
            className="px-4 py-2 border rounded-md"
          >
            <option value="">Alla loger</option>
            {lodges.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          {user &&
            (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)) && (
              <Link
                to="/members/create"
                className="flex items-center text-white bg-green-600 hover:bg-green-700 text-sm font-medium transition px-3 py-2 rounded-md"
              >
                Skapa
              </Link>
            )}
        </div>

        {loading && <Spinner />}
        {Array.isArray(members) && (
          <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-1 lg:grid-cols-3">
            {members.map((member: PublicUser) => (
              <Link
                to={`/members/${member.id}`}
                key={member.id}
                className="p-4 bg-white rounded-md shadow-md hover:shadow-lg transition flex items-center gap-x-4"
              >
                <img
                  src={member.picture}
                  alt={`${member.firstname} ${member.lastname}`}
                  className="w-16 h-16 rounded-full flex-shrink-0"
                />
                <div>
                  <div className="font-semibold">
                    {member.firstname} {member.lastname}
                  </div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
