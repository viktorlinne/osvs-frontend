import api, { fetchData } from "./api";
import type { Lodge, UpdateLodgeBody } from "../types";
import { readArrayField, readBooleanField, readObjectField } from "./parsers/response";

export type LodgeMutationResult = {
  success: boolean;
};

function parseMutationResult(source: unknown): LodgeMutationResult {
  return {
    success: readBooleanField(source, "success") ?? false,
  };
}

export async function listLodges(): Promise<Lodge[]> {
  const data = await fetchData(api.get("/lodges"));
  return readArrayField<Lodge>(data, "lodges");
}

export async function updateLodge(
  id: number | string,
  payload: UpdateLodgeBody,
): Promise<LodgeMutationResult> {
  return parseMutationResult(await fetchData(api.put(`/lodges/${id}`, payload)));
}

export async function getLodge(id: number | string): Promise<Lodge | null> {
  const response = await fetchData(api.get(`/lodges/${id}`));
  return (readObjectField(response, "lodge") as Lodge | null) ?? null;
}

export default { listLodges, updateLodge };
