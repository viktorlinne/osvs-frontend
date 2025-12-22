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
  CreatePost,
  Profile,
  MembersPage,
  MemberDetail,
  UsersCreate,
  LodgesPage,
  EventDetail,
  EventsPage,
  CreateEvent,
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
        path: "posts/create",
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
        path: "members/create",
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
      {
        path: "lodges",
        element: (
          <AuthGuard>
            <LodgesPage />
          </AuthGuard>
        ),
      },
      {
        path: "events",
        element: (
          <AuthGuard>
            <EventsPage />
          </AuthGuard>
        ),
      },
      {
        path: "events/:id",
        element: (
          <AuthGuard>
            <EventDetail />
          </AuthGuard>
        ),
      },
      {
        path: "events/:id/edit",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <EventDetail />
          </AuthGuard>
        ),
      },
      {
        path: "events/create",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <CreateEvent />
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
