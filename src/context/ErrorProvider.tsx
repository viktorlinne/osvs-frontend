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

    return (
        <ErrorContext.Provider value={{ error, setError, clearError }}>
            <div className="relative">
                {error ? (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
                        <div className="bg-red-600 text-white rounded shadow p-3 text-center">
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
