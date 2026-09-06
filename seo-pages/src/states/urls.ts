import { CHECKOUT_PATH } from "../urls";

const STATE_SLUG_RE = /^[a-z]+(?:-[a-z]+)*$/;

export function statePath(slug: string): string {
  return `/states/${slug}`;
}

export function statesHubPath(): string {
  return "/states";
}

export function statesCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "states",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function reservedStateSlugReason(slug: string): string | null {
  if (!STATE_SLUG_RE.test(slug)) {
    return "state slug must be lowercase kebab-case letters";
  }
  if (slug === "joker") {
    return "state slug cannot be 'joker'";
  }
  return null;
}

export function assertStateSlug(slug: string): void {
  const reason = reservedStateSlugReason(slug);
  if (reason) {
    throw new Error(`Invalid state slug "${slug}": ${reason}`);
  }
}
