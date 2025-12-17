import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import Router from "./routes/Router";
import { RouterProvider } from "react-router";
import { AuthProvider } from "./context/AuthProvider";
import { ErrorProvider } from "./context";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorProvider>
      <AuthProvider>
        <RouterProvider router={Router} />
      </AuthProvider>
    </ErrorProvider>
  </StrictMode>
);
