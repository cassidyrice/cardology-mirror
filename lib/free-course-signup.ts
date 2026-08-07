export const FREE_COURSE_SLUG = "read-your-birth-card-free-course";
export const FREE_COURSE_TTL_DAYS = 365;

export type CourseSignup = {
  name: string;
  firstName: string;
  email: string;
  source: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function valueOf(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

export function normalizeCourseSignup(input: Record<string, unknown>): CourseSignup {
  const name = valueOf(input.name).replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) {
    throw new Error("Name is required");
  }

  const email = valueOf(input.email).toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new Error("Enter a valid email address");
  }

  const source = valueOf(input.source).slice(0, 80) || "free-course";
  return {
    name,
    firstName: name.split(" ")[0],
    email,
    source,
  };
}

export async function addCourseContact(
  signup: CourseSignup,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  if (!apiKey) throw new Error("Email list is not configured");

  const response = await fetcher("https://api.resend.com/contacts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      email: signup.email,
      firstName: signup.firstName,
      unsubscribed: false,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (response.status === 409) return "existing";
  if (!response.ok || !body.id) {
    throw new Error(body.message || `Resend contact creation failed (${response.status})`);
  }
  return body.id;
}
