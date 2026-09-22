"use client";

import { DeepDiveCta } from "./DeepDiveCta";

export function HeaderDeepDiveCta({
  variant = "button",
}: {
  variant?: "button" | "menu";
}) {
  return (
    <DeepDiveCta
      placement="site-header"
      source="site-header"
      variant={variant}
    />
  );
}
