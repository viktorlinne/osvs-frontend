import type {
  Achievement,
  OfficialHistoryItem,
  User as PublicUserBase,
} from "./domain";
import type {
  CreateEventBody,
  CreateLodgeBody,
  LoginBody,
  UpdateEventBody,
  UpdateLodgeBody,
} from "./dto";

export type PublicUser = PublicUserBase;

export type AuthUser = PublicUser & {
  roles?: string[];
  achievements?: Achievement[] | null;
  officials?: number[];
  officialHistory?: OfficialHistoryItem[] | null;
};

export type LoginPayload = LoginBody;
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
