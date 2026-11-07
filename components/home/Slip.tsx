import Link from "next/link";

/**
 * How a reading happens, printed as an itinerary on a slip
 * (docs/design/DIRECTION.md §2). Every value is something the site already
 * states: free, from $13, within 24 hours, seven days of follow-up.
 */
const STAGES = [
  {
    when: "Now",
    rows: [
      { what: "Enter your birthday", value: "free" },
      { what: "Read your card's free meaning", value: "free" },
      { what: "Compare it with one other card", value: "free" },
    ],
  },
  {
    when: "If you order a reading",
    rows: [
      { what: "Pick one of the readings below, on Stan", value: "from $13" },
      { what: "Cass reviews and approves every reading", value: "within 24 hours" },
      { what: "The PDF arrives by email, privately", value: "included" },
      { what: "Email follow-up", value: "seven days" },
    ],
  },
] as const;

export function Slip() {
  return (
    <>
      <p className="slip-link" data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
        <Link href="/methodology" className="editorial-link">Check the math. We show our work</Link>
      </p>
      <div className="slip-band" data-rise style={{ "--rise-i": 3 } as React.CSSProperties}>
        <div className="slip" role="group" aria-label="How a reading happens">
          {STAGES.map((stage) => (
            <div key={stage.when} className="slip-stage">
              <p className="slip-when">{stage.when}</p>
              <ul className="slip-rows">
                {stage.rows.map((row) => (
                  <li key={row.what} className="slip-row">
                    <span className="slip-what">{row.what}</span>
                    <span className="slip-dots" aria-hidden="true" />
                    <span className="slip-value tnum">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="slip-total">
            <span>You hold one PDF about you, in plain words</span>
            <span className="tnum">from $13</span>
          </p>
        </div>
      </div>
      <p className="slip-note" data-rise style={{ "--rise-i": 4 } as React.CSSProperties}>
        An old card system. Your judgment still applies.
      </p>
    </>
  );
}
