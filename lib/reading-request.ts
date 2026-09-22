/**
 * The reading API must receive the birthday in the POST body.
 * Middleware strips `birthdate` from every URL, so a GET query is read as blank
 * and the engine answers "invalid birthdate".
 */

export function readingApiRequest(birthdate: string, date?: string): {
  url: "/api/reading";
  init: RequestInit;
} {
  const payload: { birthdate: string; date?: string } = { birthdate };
  if (date) payload.date = date;
  return {
    url: "/api/reading",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  };
}
