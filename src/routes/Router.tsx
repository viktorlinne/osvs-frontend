import { createBrowserRouter } from "react-router";
import {
  NotFound,
  HomePage,
  AboutPage,
  GdprPage,
  ContactPage,
  LoginPage,
  NewsPage,
  PostDetail,
  CreatePost,
  Profile,
  ProfileAttended,
  MembersPage,
  MembersMapPage,
  MemberDetail,
  MemberAttended,
  CreateMember,
  LodgesPage,
  LodgeDetail,
  EventDetail,
  EventsPage,
  CreateEvent,
  MembershipPage,
  RevisionsPage,
  DocumentsPage,
  UploadRevisions,
  UploadDocument,
  Regalia
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
      {
        path: "lodges",
        element: <LodgesPage />,
      },
      {
        path: "lodges/:id",
        element: <LodgeDetail />,
      },
      // Protected routes
      {
        path: "posts",
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
        path: "members/map",
        element: (
          <AuthGuard>
            <MembersMapPage />
          </AuthGuard>
        ),
      },
      {
        path: "members/create",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <CreateMember />
          </AuthGuard>
        ),
      },
      {
        path: "members/:matrikelnummer",
        element: (
          <AuthGuard>
            <MemberDetail />
          </AuthGuard>
        ),
      },
      {
        path: "members/:matrikelnummer/edit",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <MemberDetail />
          </AuthGuard>
        ),
      },
      {
        path: "members/:matrikelnummer/attended",
        element: (
          <AuthGuard>
            <MemberAttended />
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
        path: "profile/memberships",
        element: (
          <AuthGuard>
            <MembershipPage />
          </AuthGuard>
        ),
      },
      {
        path: "profile/attended",
        element: (
          <AuthGuard>
            <ProfileAttended />
          </AuthGuard>
        ),
      },
      {
        path: "posts/:id/edit",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <PostDetail />
          </AuthGuard>
        ),
      },
      {
        path: "posts/:id",
        element: (
          <AuthGuard>
            <PostDetail />
          </AuthGuard>
        ),
      },
      {
        path: "lodges/:id/edit",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <LodgeDetail />
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
      {
        path: "revisions",
        element: (
          <AuthGuard>
            <RevisionsPage />
          </AuthGuard>
        ),
      },
      {
        path: "revisions/create",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <UploadRevisions />
          </AuthGuard>
        ),
      },
      {
        path: "documents",
        element: (
          <AuthGuard>
            <DocumentsPage />
          </AuthGuard>
        ),
      },
      {
        path: "documents/create",
        element: (
          <AuthGuard roles={["Admin", "Editor"]}>
            <UploadDocument />
          </AuthGuard>
        ),
      },
      {
        path: "regalia",
        element: (
          <AuthGuard >
            <Regalia />
          </AuthGuard>
        ),
      },
      //*! Not Found Route *!//
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
];

const Router = createBrowserRouter(routes);

export default Router;
