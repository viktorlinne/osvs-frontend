import { describe, expect, it } from "vitest";
import {
  getEventFormErrors,
  getLodgeFormErrors,
  loginFormRules,
} from "./formValidation";

describe("formValidation", () => {
  it("validates login email rule", () => {
    const emailRule = loginFormRules.email.validate as {
      required: (value: unknown) => true | string;
      email: (value: unknown) => true | string;
    };

    expect(emailRule.required("")).toBe("E-post är obligatoriskt");
    expect(emailRule.email("not-an-email")).toBe("Ogiltig e-postadress");
    expect(emailRule.email("user@example.com")).toBe(true);
  });

  it("returns lodge form errors for missing required fields", () => {
    expect(getLodgeFormErrors({ name: "", city: "", email: "" })).toEqual({
      name: "Namn är obligatoriskt",
      city: "Stad är obligatorisk",
    });
  });

  it("returns event form errors when dates are invalid", () => {
    const errors = getEventFormErrors({
      title: "Möte",
      description: "Info",
      startDate: "bad",
      endDate: "also-bad",
      price: "-1",
    });

    expect(errors.startDate).toBe("Ogiltigt datum eller tid");
    expect(errors.endDate).toBe("Ogiltigt datum eller tid");
    expect(errors.price).toBe("Pris måste vara 0 eller större");
  });
});
