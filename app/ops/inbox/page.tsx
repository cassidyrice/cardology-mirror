import type { Metadata } from "next";

import { ApprovalStudio } from "@/components/ops/ApprovalStudio";

export const metadata: Metadata = {
  title: "Inbox · Card Blueprints ops",
  robots: { index: false, follow: false, nocache: true },
};

/** Private mobile-first Approval Studio for 3-angle personal question readings. */
export default function OpsInboxPage() {
  return <ApprovalStudio />;
}
