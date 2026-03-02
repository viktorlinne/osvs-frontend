import api, { fetchData } from "./api";
import type { Allergy } from "../types";
import { readArrayField } from "./parsers/response";

export type MemberAllergiesResponse = {
  allergies: Allergy[];
};

export async function listAllergies(): Promise<Allergy[]> {
  const res = await fetchData(api.get("/allergies"));
  return readArrayField<Allergy>(res, "allergies");
}

export async function setMemberAllergies(
  matrikelnummer: string | number,
  allergyIds: number[],
): Promise<MemberAllergiesResponse> {
  const res = await fetchData(
    api.put(`/allergies/member/${String(matrikelnummer)}`, { allergyIds }),
  );
  return {
    allergies: readArrayField<Allergy>(res, "allergies"),
  };
}

export default {
  listAllergies,
  setMemberAllergies,
};
