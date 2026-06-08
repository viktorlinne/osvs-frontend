import { Suspense, lazy, type ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import { AppLayout } from "../app/AppLayout";
import AuthGuard from "./AuthGuard";
import { RouteErrorPage } from "../pages/RouteErrorPage";

function lazyNamedPage(
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
) {
  return lazy(async () => {
    const module = await loader();
    const component = module[exportName];
    if (typeof component !== "function") {
      throw new Error(`Kunde inte hitta sids export "${exportName}"`);
    }
    return { default: component as ComponentType };
  });
}

function renderPage(Page: ComponentType) {
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}

function renderProtectedPage(Page: ComponentType, roles?: string[]) {
  return <AuthGuard roles={roles}>{renderPage(Page)}</AuthGuard>;
}

const NotFound = lazyNamedPage(() => import("../pages/NotFound"), "NotFound");
const HomePage = lazyNamedPage(() => import("../pages/HomePage"), "HomePage");
const AboutPage = lazyNamedPage(
  () => import("../pages/AboutPage"),
  "AboutPage",
);
const GdprPage = lazyNamedPage(() => import("../pages/GdprPage"), "GdprPage");
const ContactPage = lazyNamedPage(
  () => import("../pages/ContactPage"),
  "ContactPage",
);
const LoginPage = lazyNamedPage(
  () => import("../pages/LoginPage"),
  "LoginPage",
);
const ForgotPasswordPage = lazyNamedPage(
  () => import("../pages/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
const SetPasswordPage = lazyNamedPage(
  () => import("../pages/SetPasswordPage"),
  "SetPasswordPage",
);
const NewsPage = lazyNamedPage(() => import("../pages/PostsPage"), "NewsPage");
const PostDetail = lazyNamedPage(
  () => import("../pages/PostDetail"),
  "PostDetail",
);
const CreatePost = lazyNamedPage(
  () => import("../pages/CreatePost"),
  "CreatePost",
);
const Profile = lazyNamedPage(() => import("../pages/Profile"), "Profile");
const ProfileAttended = lazyNamedPage(
  () => import("../pages/ProfileAttended"),
  "ProfileAttended",
);
const MembersPage = lazyNamedPage(
  () => import("../pages/MembersPage"),
  "MembersPage",
);
const MapPage = lazyNamedPage(() => import("../pages/MapPage"), "MapPage");
const MemberDetail = lazyNamedPage(
  () => import("../pages/MemberDetail"),
  "MemberDetail",
);
const MemberAttended = lazyNamedPage(
  () => import("../pages/MemberAttended"),
  "MemberAttended",
);
const CreateMember = lazyNamedPage(
  () => import("../pages/CreateMember"),
  "CreateMember",
);
const LodgesPage = lazyNamedPage(
  () => import("../pages/LodgesPage"),
  "LodgesPage",
);
const LodgeDetail = lazyNamedPage(
  () => import("../pages/LodgeDetail"),
  "LodgeDetail",
);
const EventDetail = lazyNamedPage(
  () => import("../pages/EventDetail"),
  "EventDetail",
);
const EventsPage = lazyNamedPage(
  () => import("../pages/EventsPage"),
  "EventsPage",
);
const CreateEvent = lazyNamedPage(
  () => import("../pages/CreateEvent"),
  "CreateEvent",
);
const MembershipPage = lazyNamedPage(
  () => import("../pages/MembershipPage"),
  "MembershipPage",
);
const MembershipPaymentsPage = lazyNamedPage(
  () => import("../pages/MembershipPaymentsPage"),
  "MembershipPaymentsPage",
);
const RevisionsPage = lazyNamedPage(
  () => import("../pages/RevisionsPage"),
  "RevisionsPage",
);
const DocumentsPage = lazyNamedPage(
  () => import("../pages/DocumentsPage"),
  "DocumentsPage",
);
const UploadRevisions = lazyNamedPage(
  () => import("../pages/UploadRevisions"),
  "UploadRevisions",
);
const UploadDocument = lazyNamedPage(
  () => import("../pages/UploadDocument"),
  "UploadDocument",
);
const Regalia = lazyNamedPage(() => import("../pages/Regalia"), "Regalia");

const routes = [
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: "/",
        element: renderPage(HomePage),
      },
      {
        path: "about",
        element: renderPage(AboutPage),
      },
      {
        path: "gdpr",
        element: renderPage(GdprPage),
      },
      {
        path: "contact",
        element: renderPage(ContactPage),
      },
      {
        path: "login",
        element: renderPage(LoginPage),
      },
      {
        path: "forgot-password",
        element: renderPage(ForgotPasswordPage),
      },
      {
        path: "set-password",
        element: renderPage(SetPasswordPage),
      },
      {
        path: "lodges",
        element: renderPage(LodgesPage),
      },
      {
        path: "lodges/:id",
        element: renderPage(LodgeDetail),
      },
      // Protected routes
      {
        path: "posts",
        element: renderProtectedPage(NewsPage),
      },
      {
        path: "posts/create",
        element: renderProtectedPage(CreatePost, ["Admin", "Editor"]),
      },
      {
        path: "members",
        element: renderProtectedPage(MembersPage),
      },
      {
        path: "members/create",
        element: renderProtectedPage(CreateMember, ["Admin", "Editor"]),
      },
      {
        path: "members/:matrikelnummer",
        element: renderProtectedPage(MemberDetail),
      },
      {
        path: "members/:matrikelnummer/edit",
        element: renderProtectedPage(MemberDetail, ["Admin", "Editor"]),
      },
      {
        path: "members/:matrikelnummer/attended",
        element: renderProtectedPage(MemberAttended),
      },
      {
        path: "profile",
        element: renderProtectedPage(Profile),
      },
      {
        path: "profile/edit",
        element: renderProtectedPage(Profile),
      },
      {
        path: "profile/memberships",
        element: renderProtectedPage(MembershipPage),
      },
      {
        path: "admin/membership-payments",
        element: renderProtectedPage(MembershipPaymentsPage, ["Admin"]),
      },
      {
        path: "profile/attended",
        element: renderProtectedPage(ProfileAttended),
      },
      {
        path: "posts/:id/edit",
        element: renderProtectedPage(PostDetail, ["Admin", "Editor"]),
      },
      {
        path: "posts/:id",
        element: renderProtectedPage(PostDetail),
      },
      {
        path: "lodges/:id/edit",
        element: renderProtectedPage(LodgeDetail, ["Admin", "Editor"]),
      },
      {
        path: "events",
        element: renderProtectedPage(EventsPage),
      },
      {
        path: "events/:id",
        element: renderProtectedPage(EventDetail),
      },
      {
        path: "events/:id/edit",
        element: renderProtectedPage(EventDetail, ["Admin", "Editor"]),
      },
      {
        path: "events/create",
        element: renderProtectedPage(CreateEvent, ["Admin", "Editor"]),
      },
      {
        path: "revisions",
        element: renderProtectedPage(RevisionsPage),
      },
      {
        path: "revisions/create",
        element: renderProtectedPage(UploadRevisions, ["Admin", "Editor"]),
      },
      {
        path: "documents",
        element: renderProtectedPage(DocumentsPage),
      },
      {
        path: "documents/create",
        element: renderProtectedPage(UploadDocument, ["Admin", "Editor"]),
      },
      {
        path: "regalia",
        element: renderProtectedPage(Regalia),
      },
      {
        path: "map",
        element: renderProtectedPage(MapPage),
      },
//*! Not Found Route *!//
      {
        path: "*",
        element: renderPage(NotFound),
      },
    ],
  },
];

const Router = createBrowserRouter(routes);

export default Router;
