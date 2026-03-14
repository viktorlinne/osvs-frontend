export type UpdateUserForm = {
  firstname?: string;
  lastname?: string;
  dateOfBirth?: string;
  work?: string | null;
  notes?: string | null;
  mobile?: string;
  homeNumber?: string | null;
  city?: string;
  address?: string;
  zipcode?: string;
  accommodationAvailable?: boolean | null;
};

export type CreatePostForm = {
  title: string;
  description?: string;
  picture?: string;
  lodgeIds?: string[];
  publicum?: boolean;
};

export type UpdatePostForm = CreatePostForm;

export type RegisterForm = {
  email?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  dateOfBirth?: string;
  mobile?: string;
  city?: string;
  address?: string;
  zipcode?: string;
  work?: string | null;
  homeNumber?: string | null;
  lodgeId?: string | number | null;
  notes?: string | null;
};
