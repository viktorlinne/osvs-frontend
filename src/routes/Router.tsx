import { createBrowserRouter } from "react-router";
import {
  NotFound,
  HomePage,
  AboutPage,
  GdprPage,
  ContactPage,
  LoginPage,
  NewsPage,
  NewsDetail,
  // Create post page
  CreatePost,
  // Members / profile
  Profile,
  MembersPage,
  MemberDetail,
  UsersCreate,
} from "../pages";
import { AppLayout } from "../app/AppLayout";
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
      // Protected routes
      {
        path: "news",
        element: (
          <AuthGuard>
            <NewsPage />
          </AuthGuard>
        ),
      },
      {
        path: "news/create",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <CreatePost />
          </AuthGuard>
        ),
      },
      {
        path: "members",
        element: (
          <AuthGuard>
            <MembersPage />
          </AuthGuard>
        ),
      },
      {
        path: "users/create",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <UsersCreate />
          </AuthGuard>
        ),
      },
      {
        path: "members/:id",
        element: (
          <AuthGuard>
            <MemberDetail />
          </AuthGuard>
        ),
      },
      {
        path: "members/:id/edit",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <MemberDetail />
          </AuthGuard>
        ),
      },
      {
        path: "profile",
        element: (
          <AuthGuard>
            <Profile />
          </AuthGuard>
        ),
      },
      {
        path: "profile/edit",
        element: (
          <AuthGuard>
            <Profile />
          </AuthGuard>
        ),
      },
      {
        path: "news/:id/edit",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <NewsDetail />
          </AuthGuard>
        ),
      },
      {
        path: "news/:id",
        element: (
          <AuthGuard>
            <NewsDetail />
          </AuthGuard>
        ),
      },
      // 404 route
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
];

const Router = createBrowserRouter(routes);

export default Router;
