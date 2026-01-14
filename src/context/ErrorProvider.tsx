import React, { useEffect, useState } from "react";
import ErrorContext from "./ErrorContext";
import { registerGlobalErrorHandler, unregisterGlobalErrorHandler } from "../services/globalError";

export function ErrorProvider({ children }: { children: React.ReactNode }) {
    const [error, setErrorState] = useState<string | null>(null);

    function setError(msg: string | null) {
        setErrorState(msg);
    }

    function clearError() {
        setErrorState(null);
    }

    useEffect(() => {
        registerGlobalErrorHandler(setErrorState);
        return () => unregisterGlobalErrorHandler();
    }, []);

    // Auto-dismiss any error after 10 seconds
    useEffect(() => {
        if (!error) return;
        const t = setTimeout(() => setErrorState(null), 10000);
        return () => clearTimeout(t);
    }, [error]);

    return (
        <ErrorContext.Provider value={{ error, setError, clearError }}>
            <div
                className="relative"
                onClick={clearError}>
                {error ? (
                    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
                        <div className="bg-red-600 hover:bg-red-700 transition text-white rounded-md shadow p-3 text-center">
                            {error}
                        </div>
                    </div>
                ) : null}
                {children}
            </div>
        </ErrorContext.Provider>
    );
}

export default ErrorProvider;
