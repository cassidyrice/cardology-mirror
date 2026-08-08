export async function addResendContact(
  email: string,
  apiKey: string,
  fetcher: typeof fetch = fetch,
  options: { firstName?: string } = {},
): Promise<string> {
  if (!apiKey) throw new Error("Email list is not configured");

  const normalizedEmail = email.trim().toLowerCase();
  const response = await fetcher("https://api.resend.com/contacts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      email: normalizedEmail,
      ...(options.firstName ? { firstName: options.firstName } : {}),
      unsubscribed: false,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };
  if (response.status === 409) return "existing";
  if (!response.ok || !body.id) {
    throw new Error(body.message || `Resend contact creation failed (${response.status})`);
  }
  return body.id;
}
