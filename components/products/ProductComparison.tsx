import Link from "next/link";

import { PUBLIC_PRODUCTS } from "@/lib/products";
import { TableScroll } from "@/components/seo/TableScroll";

const ROLES: Record<string, { category: string; start: string }> = {
  "personal-card-blueprint": {
    category: "Personalized report for one birth date",
    start: "Start here if you want your own written pattern.",
  },
  "analog-algorithm": {
    category: "How the system and formula work",
    start: "Choose this if you want the method, not a personal report.",
  },
  "complete-card-blueprint": {
    category: "Reference guide to the full deck and system",
    start: "Choose this if you want the handbook beside the report.",
  },
};

export function ProductComparison() {
  const products = PUBLIC_PRODUCTS.filter((product) => ROLES[product.slug]);
  return (
    <section aria-labelledby="product-compare-heading" className="mt-12">
      <h2 id="product-compare-heading" className="type-h2 text-brand-ink">
        Which product is which
      </h2>
      <p className="mt-3 max-w-[40em] text-sm leading-relaxed text-brand-ink-soft">
        Three separate things: one personalized report, one method book, one
        full-deck handbook. They do not replace each other.
      </p>
      <TableScroll className="mt-6" label="Product comparison">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Compare Personal Card Blueprint, Analog Algorithm, and Complete Card Blueprint
          </caption>
          <thead>
            <tr className="border-b border-brand-line text-brand-ink">
              <th scope="col" className="py-3 pr-4 font-medium">Product</th>
              <th scope="col" className="py-3 pr-4 font-medium">Best for</th>
              <th scope="col" className="py-3 pr-4 font-medium">What you get</th>
              <th scope="col" className="py-3 font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.slug} className="border-b border-brand-line">
                <th scope="row" className="py-3 pr-4 font-medium text-brand-ink">
                  <Link href={product.href ?? `/products/${product.slug}`} className="underline underline-offset-4">
                    {product.name}
                  </Link>
                </th>
                <td className="py-3 pr-4 text-brand-ink-soft">{ROLES[product.slug]?.category}</td>
                <td className="py-3 pr-4 text-brand-ink-soft">{product.deliverable}</td>
                <td className="py-3 text-brand-ink">{product.priceLabel} one time</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </section>
  );
}
