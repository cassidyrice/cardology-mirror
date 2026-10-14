"use client";

import { DeepDiveCta } from "./DeepDiveCta";

export function HeaderDeepDiveCta({
  variant = "button",
}: {
  variant?: "button" | "menu";
}) {
  return (
    <DeepDiveCta
      headerLabel="Full reading"
      placement="site-header"
      source="site-header"
      variant={variant}
    />
  );
}
