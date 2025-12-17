import { createContext } from "react";

export type ErrorContextValue = {
    error: string | null;
    setError: (message: string | null) => void;
    clearError: () => void;
};

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

export default ErrorContext;
