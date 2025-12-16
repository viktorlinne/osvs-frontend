import api, { fetchData } from "./api";

export async function createMail(payload: Record<string, unknown>) {
	return fetchData(api.post(`/mails`, payload));
}

export async function sendMail(id: number | string) {
	return fetchData(api.post(`/mails/${id}/send`));
}

export async function inbox() {
	return fetchData(api.get(`/mails/inbox`));
}

export default { createMail, sendMail, inbox };
