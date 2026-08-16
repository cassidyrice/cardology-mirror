export type RobotsMeta = Readonly<{
  name: string;
  content: string;
}>;

export type RobotsDirective = Readonly<{
  source: string;
  value: string;
}>;

function isCrawlerName(name: string): boolean {
  return /(?:bot|spider)(?:[-_][a-z0-9_-]+)*$|^slurp$/i.test(name);
}

function directiveValues(content: string): string[] {
  return content
    .toLowerCase()
    .split(",")
    .flatMap((part) => {
      const value = part.trim();
      if (!value) return [];
      if (value.includes(":")) {
        return [value.replace(/\s*:\s*/g, ":")];
      }
      return value.split(/\s+/).flatMap((token) =>
        token === "none" ? ["noindex", "nofollow"] : [token],
      );
    });
}

export function parseRobotsMetaDirectives(
  meta: readonly RobotsMeta[],
): RobotsDirective[] {
  return meta.flatMap(({ name, content }) => {
    const normalizedName = name.trim().toLowerCase();
    if (normalizedName !== "robots" && !isCrawlerName(normalizedName)) {
      return [];
    }
    return directiveValues(content).map((value) => ({
      source: `meta ${normalizedName}`,
      value,
    }));
  });
}

export function parseXRobotsTagDirectives(
  headers: string | readonly string[],
): RobotsDirective[] {
  const headerValues = typeof headers === "string" ? [headers] : headers;
  return headerValues.flatMap((header) =>
    header.split(/\r?\n/).flatMap((line) => {
      let crawlerName: string | null = null;

      return line.split(",").flatMap((part) => {
        let directive = part.trim();
        const colonIndex = directive.indexOf(":");
        if (colonIndex > 0) {
          const possibleCrawler = directive
            .slice(0, colonIndex)
            .trim()
            .toLowerCase();
          if (isCrawlerName(possibleCrawler)) {
            crawlerName = possibleCrawler;
            directive = directive.slice(colonIndex + 1).trim();
          }
        }

        const source = crawlerName
          ? `x-robots-tag ${crawlerName}`
          : "x-robots-tag";
        return directiveValues(directive).map((value) => ({ source, value }));
      });
    }),
  );
}

export function indexBlockingDirectives(
  directives: readonly RobotsDirective[],
): RobotsDirective[] {
  return directives.filter(({ value }) => value === "noindex");
}
