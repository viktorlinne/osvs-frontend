import { z } from "zod";

const isValidDateString = (s: unknown) => {
  if (typeof s !== "string") return false;
  const t = Date.parse(s);
  return !Number.isNaN(t);
};

export const addAchievementSchema = z.object({
  achievementId: z.coerce.number().int().positive(),
  awardedAt: z
    .string()
    .optional()
    .nullable()
    .refine((v) => v == null || isValidDateString(v), {
      message: "awardedAt must be a valid date string",
    }),
});

export const setRolesSchema = z.object({
  roleIds: z.array(z.coerce.number().int().positive()),
});

export const setLodgeSchema = z.object({
  lodgeId: z.union([z.coerce.number().int().positive(), z.null()]),
});

export const updateUserSchema = z.object({
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine((v) => v == null || isValidDateString(v), {
      message: "dateOfBirth must be a valid date string",
    }),
  official: z.string().optional().nullable(),
  homeNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  mobile: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  zipcode: z.string().optional(),
});

export const registerSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  dateOfBirth: z.string().min(1),
  official: z.string().optional(),
  mobile: z.string().min(1),
  homeNumber: z.string().optional().nullable(),
  city: z.string().min(1),
  address: z.string().min(1),
  zipcode: z.string().min(1),
  notes: z.string().optional().nullable(),
  lodgeId: z.string().optional().nullable(),
});

export type RegisterForm = {
  username: string;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  dateOfBirth: string;
  official?: string;
  mobile: string;
  homeNumber?: string | null;
  city: string;
  address: string;
  zipcode: string;
  notes?: string | null;
  lodgeId?: string | null;
};

export type UpdateUserForm = {
  firstname?: string;
  lastname?: string;
  dateOfBirth?: string;
  official?: string | null;
  homeNumber?: string | null;
  notes?: string | null;
  mobile?: string;
  city?: string;
  address?: string;
  zipcode?: string;
};
