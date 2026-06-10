import type { Metadata } from "next";

// App surface: not a content page. Keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
