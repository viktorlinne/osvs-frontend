export type Role = {
  id: number;
  role?: "Admin" | "Editor" | "Member";
  name?: string;
};

export type Lodge = {
  id: number;
  name: string;
  city: string;
  description: string;
  email?: string | null;
  picture?: string | null;
};

export type User = {
  matrikelnummer: number;
  email: string;
  passwordHash: string;
  createdAt: string;
  picture: string;
  pictureUrl?: string;
  achievements?: Achievement[] | null;
  allergies?: Allergy[] | null;
  officialHistory?: OfficialHistoryItem[] | null;
  archive?: "Deceased" | "Retired" | "Removed" | null;
  firstname: string;
  lastname: string;
  dateOfBirth: string;
  work?: string | null;
  revokedAt?: string | null;
  accommodationAvailable?: boolean | null;
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
  publicum?: boolean;
  lodges?: Array<Pick<Lodge, "id" | "name">>;
};

export type Event = {
  id: number;
  title: string;
  description: string;
  lodgeMeeting?: boolean | null;
  food?: boolean | null;
  price: number;
  startDate: string;
  endDate: string;
};

export type AttendedEvent = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
};

export type AttendedEventsResponse = {
  events: AttendedEvent[];
  sinceLastAchievementCount: number;
  lastAchievementAt: string | null;
};

export type Achievement = {
  id: number;
  title: "I:a Graden" | "II:a Graden" | "III:e Graden" | string;
  awardedAt?: string | null;
};

export type Allergy = {
  id: number;
  title: string;
};

export type Official = {
  id: number;
  title: string;
};

export type OfficialHistoryItem = {
  id: number;
  title: string;
  appointedAt: string;
  unappointedAt: string;
};

export type UserOfficial = {
  id: number;
  uid: number;
  oid: number;
};

export type UserAchievement = {
  id: number;
  uid: number;
  aid: number;
  awardedAt: string;
};

export type EventsAttendance = {
  uid: number;
  eid: number;
  rsvp: boolean;
};

export type EventAttendanceRow = {
  uid: number;
  firstname: string;
  lastname: string;
  allergies: string[];
  rsvp: boolean;
  bookFood: boolean;
  attended: boolean;
  paymentStatus: "Pending" | "Paid" | null;
  paymentPaid: boolean;
};

export type MembershipPayment = {
  id: number;
  uid: number;
  amount: number;
  year: number;
  status: "Pending" | "Paid";
  createdAt: string;
  updatedAt: string;
};

export type EventPayment = MembershipPayment & { eid: number };

export type Revision = {
  id: number;
  lid: number;
  lodgeName: string;
  title: string;
  year: number;
  picture?: string | null;
  pictureUrl?: string | null;
};

export type SiteDocument = {
  id: number;
  title: string;
  picture?: string | null;
  pictureUrl?: string | null;
};

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
