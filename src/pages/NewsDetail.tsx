import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPost } from "../services";
import { Spinner, NotFound } from "../components";
import type { Post } from "../types";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";

export const NewsDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { error, setError, clearError } = useError();
    const { data, loading, notFound, run } = useFetch<Post | null>();

    useEffect(() => {
        let mounted = true;
        if (!id) {
            setError("Missing post id");
            return () => {
                mounted = false;
            };
        }

        (async () => {
            try {
                clearError();
                const normalized = await run(() => getPost(id));
                if (!mounted) return;
                // `data` from the hook will be set; nothing else required here
                if (!normalized) {
                    return;
                }
            } catch {
                /* handled by useFetch */
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id, clearError, setError, run]);

    return (
        <div className="flex flex-col items-center min-h-screen">
            <div className="max-w-3xl w-full mx-auto p-6">
                <Link to="/news" className="text-sm text-green-600 underline">
                    ← Back to news
                </Link>
                {loading && <Spinner />}
                {notFound ? (
                    <NotFound />
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : null}
                {data && (
                    <>
                        <h1 className="text-2xl font-bold mt-4 mb-2">{data.title}</h1>
                        {data.pictureUrl && (
                            <img
                                src={`${import.meta.env.VITE_BACKEND_URL}${data.pictureUrl}`}
                                alt={data.title}
                                className="w-full h-64 object-cover rounded mb-4"
                            />
                        )}
                        <div className="prose">
                            <p>{data.description}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NewsDetail;