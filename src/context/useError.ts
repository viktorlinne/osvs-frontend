import { useContext } from "react";
import ErrorContext from "./ErrorContext";

export function useError() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error("useError must be used within ErrorProvider");
  return ctx;
}

export default useError;
