import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// EB Garamond is self-hosted (no request to Google Fonts): variable weight
// 400-800, roman and italic, split by unicode-range so browsers only fetch
// the subsets a page uses.
import "@fontsource-variable/eb-garamond/wght.css";
import "@fontsource-variable/eb-garamond/wght-italic.css";
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
