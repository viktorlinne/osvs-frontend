import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Spinner } from "../components";
import useFetch from "../hooks/useFetch";
import type { PublicUser } from "../types";

// Placeholder members page. Backend endpoints for listing members aren't implemented yet.
export default function MembersPage() {
    async function fetchMembers(): Promise<PublicUser[]> {
        const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users`, { credentials: "include" });
        if (!resp.ok) throw new Error("Misslyckades att hämta medlemmar");
        const json = await resp.json();
        return (json.users ?? []) as PublicUser[];
    }

    const { run, loading, data: members } = useFetch<PublicUser[]>();

    useEffect(() => {
        // Try to fetch `/users` if available — if not, the hook/global handler will report.
        run(fetchMembers).catch(() => {
            // swallow; errors handled by useFetch / global error
        });
    }, [run]);

    return (
        <div className="flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full mx-auto p-6">
                <h2 className="text-2xl font-bold mb-4">Medlemmar</h2>
                {loading && <Spinner />}
                {Array.isArray(members) && (
                    <div className="grid gap-4">
                        {members.map((member: PublicUser) => (
                            <Link to={`/members/${member.id}`} key={member.id} className="block p-3 bg-white rounded shadow">
                                <img src={`${import.meta.env.VITE_BACKEND_URL}${member.pictureUrl}`} alt={`${member.firstname} ${member.lastname}`} className="w-16 h-16 rounded-full mb-2" />
                                <div className="font-semibold">{member.firstname} {member.lastname}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
