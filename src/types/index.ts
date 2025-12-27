// Frontend copies of backend types — keep in sync with backend `src/types`

export type Role = {
  id: number;
  role?: "Admin" | "Editor" | "Member";
  name?: string;
};

export type Lodge = {
  id: number;
  name: string;
  description: string;
  address?: string | null;
};

export type Establishment = {
  id: number;
  name: string;
  description: string;
  address: string;
};

export type User = {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  picture: string;
  pictureUrl?: string;
  achievements?: Achievement[] | null;
  archive?: "Deceased" | "Retired" | "Removed" | null;
  firstname: string;
  lastname: string;
  dateOfBirth: string;
  official?: string | null;
  revokedAt?: string | null;
  mobile: string;
  homeNumber?: string | null;
  city: string;
  address: string;
  zipcode: string;
  notes?: string | null;
};

export type Post = {
  id: number;
  title: string;
  description: string;
  picture?: string | null;
  pictureUrl?: string | null;
};

export type Event = {
  id: number;
  title: string;
  description: string;
  lodgeMeeting?: boolean | null;
  price: number;
  startDate: string;
  endDate: string;
};

export type Mail = { id: number; lid: number; title: string; content: string };

export type Achievement = {
  id: number;
  title: "I:a Graden" | "II:a Graden" | "III:e Graden" | string;
  awardedAt?: string | null;
};

export type UserAchievement = {
  id: number;
  uid: number;
  aid: number;
  awardedAt: string;
};

export type EventsAttendance = { uid: number; eid: number; rsvp: boolean };

export type UsersMail = {
  uid: number;
  mid: number;
  sentAt: string;
  isRead: boolean;
  delivered: boolean;
};

export type MembershipPayment = {
  id: number;
  uid: number;
  amount: number;
  year: number;
  status: "Pending" | "Paid" | "Failed" | "Refunded";
  provider?: string | null;
  provider_ref?: string | null;
  currency: string;
  invoice_token?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type EventPayment = MembershipPayment & { eid: number };

export type RevokedToken = { jti: string; expiresAt: string };
export type RefreshToken = {
  token_hash: string;
  uid: number;
  expiresAt: string;
  createdAt: string;
  isRevoked: boolean;
  replacedBy?: string | null;
  lastUsed?: string | null;
};
export type PasswordReset = {
  token_hash: string;
  uid: number;
  expiresAt: string;
  createdAt: string;
};

// DTOs (frontend request/response shapes)
export type ListLodgesQuery = {
  limit?: string | number;
  offset?: string | number;
};
export type CreateLodgeBody = {
  name?: string;
  description?: string | null;
  address?: string;
};
export type UpdateLodgeBody = {
  name?: string;
  description?: string | null;
  address?: string | null;
};

export type UpdateUserProfileBody = Partial<{
  firstname: string;
  lastname: string;
  dateOfBirth: string;
  official?: string | null;
  mobile?: string;
  city?: string;
  address?: string;
  zipcode?: string;
}>;

export type AddAchievementBody = {
  achievementId?: number;
  awardedAt?: string | null;
};
export type SetRolesBody = { roleIds?: number[] };
export type SetLodgeBody = { lodgeId?: number | null };
export type ListUsersQuery = {
  limit?: string | number;
  offset?: string | number;
  name?: string;
  achievementId?: string | number;
  lodgeId?: string | number;
};

export type ListEventsQuery = {
  limit?: string | number;
  offset?: string | number;
};
export type CreateEventBody = {
  title?: string;
  description?: string | null;
  lodgeMeeting?: boolean | null;
  price?: number;
  startDate?: string | null;
  endDate?: string | null;
};
export type UpdateEventBody = Partial<CreateEventBody>;
export type LinkLodgeBody = { lodgeId?: number | string | undefined };
export type LinkEstablishmentBody = { esId?: number | string | undefined };
export type RSVPBody = { status?: string };

export type RsvpApiStatus = string;

export type ListPostsQuery = {
  limit?: string | number;
  offset?: string | number;
};
export type CreatePostBody = { title?: string; description?: string };
export type UpdatePostBody = Partial<CreatePostBody>;

export type ListEstablishmentsQuery = {
  limit?: string | number;
  offset?: string | number;
};
export type CreateEstablishmentBody = {
  name?: string;
  description?: string | null;
  address?: string;
};
export type UpdateEstablishmentBody = Partial<CreateEstablishmentBody>;

export type CreateMailBody = { lid?: number; title?: string; content?: string };

export type CreateCheckoutBody = {
  price_id?: string;
  quantity?: number | string;
};
export type SessionStatusQuery = { session_id?: string };
export type CreateMembershipBody = { year?: number; amount?: number };
export type CreateEventPaymentBody = Record<string, unknown>;

export type SwishCreateMembershipBody = CreateMembershipBody;

export type LoginBody = { email?: string; password?: string };
export type ForgotPasswordBody = { email?: string };
export type ResetPasswordBody = { token?: string; password?: string };
export type RegisterBody = {
  username?: string;
  email?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  dateOfBirth?: string;
  official?: string;
  mobile?: string;
  city?: string;
  address?: string;
  zipcode?: string;
  notes?: string | null;
  lodgeId?: string | number | null;
};

// Compatibility aliases for previous shared-types names used in frontend
export type PublicUser = User;
export type AuthUser = PublicUser & {
  roles?: string[];
  achievements?: Achievement[] | null;
};
export type LoginPayload = { email?: string; password?: string };
export type CreateEventPayload = CreateEventBody;
export type UpdateEventPayload = UpdateEventBody;
export type CreateLodgePayload = CreateLodgeBody;
export type UpdateLodgePayload = UpdateLodgeBody;
export type ApiError = {
  message?: string;
  code?: string;
  status?: number;
  details?: unknown;
};

// Form types used by frontend pages
export type UpdateUserForm = {
  firstname?: string;
  lastname?: string;
  dateOfBirth?: string;
  official?: string | null;
  notes?: string | null;
  mobile?: string;
  homeNumber?: string | null;
  city?: string;
  address?: string;
  zipcode?: string;
};

export type CreatePostForm = { title: string; description?: string };
export type UpdatePostForm = CreatePostForm;
export type RegisterForm = {
  username?: string;
  email?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  dateOfBirth?: string;
  mobile?: string;
  city?: string;
  address?: string;
  zipcode?: string;
  official?: string | null;
  homeNumber?: string | null;
  lodgeId?: string | number | null;
  notes?: string | null;
};
