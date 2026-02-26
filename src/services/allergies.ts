import api, { fetchData } from "./api";
import type { Allergy } from "../types";

export type MemberAllergiesResponse = {
  allergies: Allergy[];
};

export async function listAllergies(): Promise<Allergy[]> {
  const res = await fetchData(api.get("/allergies"));
  return ((res as { allergies?: Allergy[] })?.allergies ?? []) as Allergy[];
}

export async function setMemberAllergies(
  matrikelnummer: string | number,
  allergyIds: number[],
): Promise<MemberAllergiesResponse> {
  const res = await fetchData(
    api.put(`/allergies/member/${String(matrikelnummer)}`, { allergyIds }),
  );
  const payload = res as { allergies?: Allergy[] };
  return {
    allergies: Array.isArray(payload?.allergies) ? payload.allergies : [],
  };
}

export default {
  listAllergies,
  setMemberAllergies,
};
