import { createBrowserRouter } from "react-router";
import {
  NotFound,
  HomePage,
  AboutPage,
  GdprPage,
  ContactPage,
  LoginPage,
  NewsPage,
} from "../pages";
import { AppLayout } from "../app/appLayout";
import AuthGuard from "./AuthGuard";

const routes = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "gdpr",
        element: <GdprPage />,
      },
      {
        path: "contact",
        element: <ContactPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "news",
        element: (
          <AuthGuard>
            <NewsPage />
          </AuthGuard>
        ),
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
];

const Router = createBrowserRouter(routes);

export default Router;
