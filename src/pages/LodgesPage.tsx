// ...existing code...
import { useEffect } from "react";
import { Spinner } from "../components";
import useFetch from "../hooks/useFetch";
import type { } from "../types";
import { listLodges } from "../services";

type Lodge = {
    id: number;
    name: string;
    description?: string;
    address?: string;
}

export const LodgesPage = () => {
    async function fetchLodges(): Promise<Lodge[]> {
        const data = await listLodges();
        return Array.isArray(data) ? (data as Lodge[]) : [];
    }

    const { run, loading, data: lodges } = useFetch<Lodge[]>();

    useEffect(() => {
        run(fetchLodges).catch(() => { /* swallow; useFetch handles errors */ });
    }, [run]);

    return (
        <div className="flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full mx-auto p-6">
                <h2 className="text-2xl font-bold mb-4">Loger</h2>
                {loading && <Spinner />}
                {Array.isArray(lodges) && (
                    <div className="grid gap-4">
                        {lodges.map((lodge: Lodge) => (
                            <div key={lodge.id} className="block p-3 bg-white rounded shadow">
                                <div className="font-semibold">{lodge.name}</div>
                                {lodge.description && <div className="text-sm text-gray-500">{lodge.description}</div>}
                                {lodge.address && <div className="text-sm text-gray-500">{lodge.description}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
// ...existing code...