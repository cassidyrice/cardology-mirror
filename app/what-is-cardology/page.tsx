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

const TITLE = "What Is Cardology? Birthday → One Playing Card";
const DESCRIPTION =
  "Cardology maps your birthday to one card in a 52-card deck — same date, same card. Not cardiology, not tarot. Free calculator + sourced history.";
