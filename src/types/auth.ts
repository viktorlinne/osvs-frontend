export type PublicUser = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  revokedAt?: string | null;
  picture?: string | null;
  pictureUrl?: string | null;
  archive?: "Deceased" | "Retired" | "Removed" | null;
  firstname: string;
  lastname: string;
  dateOfBirth: string;
  official: string;
  mobile: string;
  homeNumber?: string | null;
  city: string;
  address: string;
  zipcode: string;
  notes?: string | null;
  achievements?: Array<{
    id: number;
    aid: number;
    awardedAt: string;
    title: string;
  }>;
};

export type AuthUser =
  | (PublicUser & {
      roles: string[];
      achievements?: Array<{
        id: number;
        aid: number;
        awardedAt: string;
        title: string;
      }>;
    })
  | null;

export type LoginPayload = { email: string; password: string };
