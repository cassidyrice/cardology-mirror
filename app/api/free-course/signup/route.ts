import { NextRequest, NextResponse } from "next/server";

import { mintDownloadToken } from "@/lib/download-token";
import { sendIntakeEmail } from "@/lib/email";
import {
  addCourseContact,
  FREE_COURSE_SLUG,
  FREE_COURSE_TTL_DAYS,
  normalizeCourseSignup,
} from "@/lib/free-course-signup";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof raw.company === "string" && raw.company.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let signup;
  try {
    signup = normalizeCourseSignup(raw);
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Check your name and email" },
      { status: 400 },
    );
  }

  try {
    await addCourseContact(signup, process.env.RESEND_API_KEY || "");
    const token = await mintDownloadToken(signup.email, FREE_COURSE_SLUG, FREE_COURSE_TTL_DAYS);
    const accessUrl = `${new URL(request.url).origin}/free-course/watch?token=${encodeURIComponent(token)}`;

    try {
      await sendIntakeEmail({
        to: signup.email,
        subject: "Your free Read Your Birth Card course",
        text: `Hi ${signup.firstName},\n\nYour four-part Read Your Birth Card course is ready:\n${accessUrl}\n\nKeep this email so you can return to the modules.\n\nYou requested this course and agreed to receive occasional Card Blueprints emails. You can unsubscribe from any marketing email.\n\n— Card Blueprints`,
      });
    } catch (cause) {
      console.error("[free-course] access email failed", cause);
    }

    return NextResponse.json({ accessUrl }, { headers: { "cache-control": "no-store" } });
  } catch (cause) {
    console.error("[free-course] signup failed", cause);
    return NextResponse.json(
      { error: "Course access is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
