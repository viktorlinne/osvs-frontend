import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import type {
  CreatePostForm,
  RegisterForm,
  UpdateUserForm,
} from "../types";

type EventFormInput = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  price: string;
};

type LodgeFormInput = {
  name: string;
  city: string;
  email: string;
};

type Rule<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> =
  RegisterOptions<TFieldValues, TName>;

function requiredTrimmed(label: string) {
  return (value: unknown) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return `${label} är obligatoriskt`;
    }
    return true;
  };
}

function optionalPattern(pattern: RegExp, message: string) {
  return (value: unknown) => {
    if (typeof value !== "string") return true;
    const normalized = value.trim();
    if (normalized.length === 0) return true;
    return pattern.test(normalized) || message;
  };
}

function validDateRule(required = true) {
  return (value: unknown) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return required ? "Födelsedatum är obligatoriskt" : true;
    }
    return Number.isNaN(Date.parse(value))
      ? "Ogiltigt födelsedatum"
      : true;
  };
}

const sharedProfileFieldRules = {
  firstname: {
    validate: requiredTrimmed("Förnamn"),
  },
  lastname: {
    validate: requiredTrimmed("Efternamn"),
  },
  dateOfBirth: {
    validate: validDateRule(true),
  },
  mobile: {
    validate: {
      required: requiredTrimmed("Mobilnummer"),
      format: optionalPattern(/^[0-9+\-\s()]{6,20}$/, "Ogiltigt mobilnummer"),
    },
  },
  homeNumber: {
    validate: optionalPattern(/^[0-9+\-\s()]{6,20}$/, "Ogiltigt hemnummer"),
  },
  city: {
    validate: requiredTrimmed("Stad"),
  },
  address: {
    validate: requiredTrimmed("Adress"),
  },
  zipcode: {
    validate: {
      required: requiredTrimmed("Postnummer"),
      format: optionalPattern(/^[0-9A-Za-z\s-]{3,10}$/, "Ogiltigt postnummer"),
    },
  },
} as const;

export const loginFormRules = {
  email: {
    validate: {
      required: requiredTrimmed("E-post"),
      email: (value: unknown) => {
        if (typeof value !== "string" || value.trim().length === 0) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ? true
          : "Ogiltig e-postadress";
      },
    },
  },
  password: {
    validate: requiredTrimmed("Lösenord"),
  },
} as const;

export const registerFormRules = {
  email: loginFormRules.email,
  ...sharedProfileFieldRules,
} satisfies Record<string, Rule<RegisterForm, FieldPath<RegisterForm>>>;

export const updateUserFormRules = {
  ...sharedProfileFieldRules,
} satisfies Record<string, Rule<UpdateUserForm, FieldPath<UpdateUserForm>>>;

export const postFormRules = {
  title: {
    validate: requiredTrimmed("Titel"),
  } satisfies Rule<CreatePostForm, "title">,
  description: {
    validate: requiredTrimmed("Beskrivning"),
  } satisfies Rule<CreatePostForm, "description">,
};

export function validateImageFile(
  file: File | null | undefined,
  options?: { required?: boolean },
): string | null {
  const required = options?.required === true;
  if (!file) return required ? "Profilbild är obligatorisk" : null;
  if (file.size > 5 * 1024 * 1024) {
    return "Profilbilden måste vara högst 5 MB";
  }
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) {
    return "Profilbilden måste vara JPEG, PNG, GIF eller WebP";
  }
  return null;
}

export function validateOptionalPostImage(
  file: File | null | undefined,
  options?: { required?: boolean },
): string | null {
  const required = options?.required === true;
  if (!file) return required ? "Bild är obligatorisk" : null;
  if (file.size > 5 * 1024 * 1024) {
    return "Bilden måste vara högst 5 MB";
  }
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) {
    return "Bilden måste vara JPEG, PNG, GIF eller WebP";
  }
  return null;
}

export function getLodgeFormErrors(
  form: LodgeFormInput,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) errors.name = "Namn är obligatoriskt";
  if (!form.city.trim()) errors.city = "Stad är obligatorisk";

  if (
    form.email.trim().length > 0 &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  ) {
    errors.email = "Ogiltig e-postadress";
  }

  return errors;
}

export function getEventFormErrors(
  form: EventFormInput,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.title.trim()) errors.title = "Titel är obligatorisk";
  if (!form.description.trim()) {
    errors.description = "Beskrivning är obligatorisk";
  }
  if (!form.startDate.trim()) {
    errors.startDate = "Startdatum är obligatoriskt";
  }
  if (!form.endDate.trim()) {
    errors.endDate = "Slutdatum är obligatoriskt";
  }

  if (form.startDate.trim() && Number.isNaN(Date.parse(form.startDate))) {
    errors.startDate = "Ogiltigt datum eller tid";
  }
  if (form.endDate.trim() && Number.isNaN(Date.parse(form.endDate))) {
    errors.endDate = "Ogiltigt datum eller tid";
  }

  if (
    !errors.startDate &&
    !errors.endDate &&
    form.startDate.trim() &&
    form.endDate.trim() &&
    Date.parse(form.startDate) >= Date.parse(form.endDate)
  ) {
    errors.startDate = "Startdatum måste vara före slutdatum";
    errors.endDate = "Slutdatum måste vara efter startdatum";
  }

  if (form.price.trim().length > 0) {
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      errors.price = "Pris måste vara 0 eller större";
    }
  }

  return errors;
}
