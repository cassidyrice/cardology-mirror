"""Known US-president identifiers for the REST fallback.

These are Wikidata Q-ids and enwiki titles — not birth dates. Dates always
come from Wikidata P569 (day precision) at harvest time. SPARQL is preferred
when query.wikidata.org is up; this list is the wbgetentities fallback.
"""

from __future__ import annotations

# 45 people / 47 presidencies (Cleveland 22+24, Trump 45+47). Do not invent extras.
FALLBACK_QIDS: tuple[str, ...] = (
    "Q23",  # George Washington
    "Q11806",  # John Adams
    "Q11812",  # Thomas Jefferson
    "Q11813",  # James Madison
    "Q11815",  # James Monroe
    "Q11816",  # John Quincy Adams
    "Q11817",  # Andrew Jackson
    "Q11820",  # Martin Van Buren
    "Q11869",  # William Henry Harrison
    "Q11881",  # John Tyler
    "Q11891",  # James K. Polk
    "Q11896",  # Zachary Taylor
    "Q12306",  # Millard Fillmore
    "Q12312",  # Franklin Pierce
    "Q12325",  # James Buchanan
    "Q91",  # Abraham Lincoln
    "Q8612",  # Andrew Johnson
    "Q34836",  # Ulysses S. Grant
    "Q35686",  # Rutherford B. Hayes
    "Q34597",  # James A. Garfield
    "Q35498",  # Chester A. Arthur
    "Q35171",  # Grover Cleveland
    "Q35678",  # Benjamin Harrison
    "Q35041",  # William McKinley
    "Q33866",  # Theodore Roosevelt
    "Q35648",  # William Howard Taft
    "Q34296",  # Woodrow Wilson
    "Q35286",  # Warren G. Harding
    "Q36023",  # Calvin Coolidge
    "Q35236",  # Herbert Hoover
    "Q8007",  # Franklin D. Roosevelt
    "Q11613",  # Harry S. Truman
    "Q9916",  # Dwight D. Eisenhower
    "Q9696",  # John F. Kennedy
    "Q9640",  # Lyndon B. Johnson
    "Q9588",  # Richard Nixon
    "Q9582",  # Gerald Ford
    "Q23685",  # Jimmy Carter
    "Q9960",  # Ronald Reagan
    "Q23505",  # George H. W. Bush
    "Q1124",  # Bill Clinton
    "Q207",  # George W. Bush
    "Q76",  # Barack Obama
    "Q22686",  # Donald Trump
    "Q6279",  # Joe Biden
)

FALLBACK_ENWIKI_TITLES: tuple[str, ...] = (
    "George Washington",
    "John Adams",
    "Thomas Jefferson",
    "James Madison",
    "James Monroe",
    "John Quincy Adams",
    "Andrew Jackson",
    "Martin Van Buren",
    "William Henry Harrison",
    "John Tyler",
    "James K. Polk",
    "Zachary Taylor",
    "Millard Fillmore",
    "Franklin Pierce",
    "James Buchanan",
    "Abraham Lincoln",
    "Andrew Johnson",
    "Ulysses S. Grant",
    "Rutherford B. Hayes",
    "James A. Garfield",
    "Chester A. Arthur",
    "Grover Cleveland",
    "Benjamin Harrison",
    "William McKinley",
    "Theodore Roosevelt",
    "William Howard Taft",
    "Woodrow Wilson",
    "Warren G. Harding",
    "Calvin Coolidge",
    "Herbert Hoover",
    "Franklin D. Roosevelt",
    "Harry S. Truman",
    "Dwight D. Eisenhower",
    "John F. Kennedy",
    "Lyndon B. Johnson",
    "Richard Nixon",
    "Gerald Ford",
    "Jimmy Carter",
    "Ronald Reagan",
    "George H. W. Bush",
    "Bill Clinton",
    "George W. Bush",
    "Barack Obama",
    "Donald Trump",
    "Joe Biden",
)

US_PRESIDENT_OFFICE_QID = "Q11696"
