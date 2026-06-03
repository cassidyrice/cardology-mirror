"use client";

import BottomNav from "@/components/nav/BottomNav";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
