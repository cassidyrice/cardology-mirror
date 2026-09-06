#!/usr/bin/env python3
"""Spot-check the independent birth-card formula.

Imports only the sibling generator. Must not import pipeline / hermes / app code.
"""

from __future__ import annotations

import csv
import unittest
from pathlib import Path

from birthcard_table import card_for, generate_rows, mm_dd

CSV_PATH = Path(__file__).resolve().parent / "birthcard_table.csv"


class TestBirthcardFormula(unittest.TestCase):
    def test_spot_checks(self) -> None:
        self.assertEqual(card_for(1, 1), "K♠")
        self.assertEqual(card_for(1, 29), "J♣")
        self.assertEqual(card_for(9, 5), "6♦")
        self.assertEqual(card_for(2, 29), "9♣")
        self.assertEqual(card_for(12, 31), "Joker")

    def test_row_count_includes_feb_29(self) -> None:
        rows = generate_rows()
        dates = [date for date, _card in rows]
        self.assertEqual(len(rows), 366)
        self.assertIn("02-29", dates)
        self.assertEqual(dates[0], "01-01")
        self.assertEqual(dates[-1], "12-31")

    def test_dec_31_is_joker_cass_lock_d1(self) -> None:
        self.assertEqual(card_for(12, 31), "Joker")
        self.assertNotEqual(card_for(12, 31), "K♠")

    def test_csv_matches_formula(self) -> None:
        self.assertTrue(CSV_PATH.is_file(), f"missing {CSV_PATH}")
        with CSV_PATH.open(encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            csv_rows = [(row["mm-dd"], row["card"]) for row in reader]
        self.assertEqual(csv_rows, generate_rows())
        lookup = dict(csv_rows)
        self.assertEqual(lookup["01-01"], "K♠")
        self.assertEqual(lookup["01-29"], "J♣")
        self.assertEqual(lookup["09-05"], "6♦")
        self.assertEqual(lookup["02-29"], "9♣")
        self.assertEqual(lookup["12-31"], "Joker")

    def test_mm_dd_zero_padded(self) -> None:
        self.assertEqual(mm_dd(1, 1), "01-01")
        self.assertEqual(mm_dd(9, 5), "09-05")
        self.assertEqual(mm_dd(12, 31), "12-31")


if __name__ == "__main__":
    unittest.main()
