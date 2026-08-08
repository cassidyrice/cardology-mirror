import { addResendContact } from "./resend-contacts";

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
  return addResendContact(signup.email, apiKey, fetcher, {
    firstName: signup.firstName,
  });
}
