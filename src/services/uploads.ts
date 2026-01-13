export async function claimUpload(
  urlOrKey: string
): Promise<{ key: string; publicUrl: string }> {
  const resp = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/uploads/claim`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlOrKey }),
    }
  );
  if (!resp.ok) {
    const json = await resp.json().catch(() => ({}));
    throw new Error(
      (json && (json.error || json.message)) || "Failed to claim upload"
    );
  }
  return (await resp.json()) as { key: string; publicUrl: string };
}

export default { claimUpload };
