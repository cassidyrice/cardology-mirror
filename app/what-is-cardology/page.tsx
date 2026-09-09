import type { Metadata } from "next";
import Link from "next/link";

import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import { CARDOLOGY_TIMELINE } from "@/lib/cardology-timeline";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { DeckMatrix } from "@/components/cards/DeckMatrix";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
} from "@/lib/site";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/what-is-cardology"];

const TITLE = "What Is Cardology? Free Birth Card from Your Birthday";
const DESCRIPTION =
  "Birthday maps to one playing card — same date, same card. Free calculator here. Not cardiology or tarot. Optional $19 52xSeven Blueprint for the year.";
const OG_IMAGE = { url: "/og/what-is-cardology.png", width: 1200, height: 630, alt: "What is Cardology? Three playing cards fanned on paper" };

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/what-is-cardology" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/what-is-cardology",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};
