import { rulingCardReferenceCsv } from "@/lib/ruling-card-reference";

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(rulingCardReferenceCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="card-blueprints-planetary-ruling-card-chart.csv"',
    },
  });
}
