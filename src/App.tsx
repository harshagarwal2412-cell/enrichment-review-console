import { useMemo, useState } from "react";
import { ClassCard } from "./components/ClassCard";
import { LaneBar, Meters } from "./components/Meters";
import { CLASSES, RULES } from "./domain/catalog";
import { INITIAL_STATE, costModel, currentLane, decide, laneTotals, totalRows, undo } from "./domain/review";
import type { ReviewState } from "./domain/types";

const TOTAL = totalRows(CLASSES);

export default function App() {
  const [state, setState] = useState<ReviewState>(INITIAL_STATE);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const totals = useMemo(() => laneTotals(CLASSES, state), [state]);
  const model = useMemo(() => costModel(CLASSES, state), [state]);
  const initialAutoPct = Math.round((laneTotals(CLASSES, INITIAL_STATE).auto / TOTAL) * 100);

  return (
    <div className="wrap">
      <header>
        <div className="eyebrow">Case study · AI product-data enrichment</div>
        <h1>Enrichment is solved. Approval isn’t.</h1>
        <p className="standfirst">
          Proton PIM can enrich 1,000 products in 30 minutes. A distributor approving those enrichments row by row
          cannot. This is a working console for the half of the workflow that still runs at human speed.
        </p>
        <div className="byline">
          <span>
            <strong>Harsh Agarwal</strong>
          </span>
        </div>
      </header>

      <section className="premise">
        <h2>The problem, in Proton’s own numbers</h2>
        <p>
          Proton PIM advertises <strong>10,000 SKUs enriched in 5 hours</strong> and{" "}
          <strong>15+ fields added per SKU</strong>. That is roughly <strong>150,000 proposed attribute values</strong>{" "}
          arriving at a distributor’s data team in a single afternoon. The published workflow then says: “users review
          and approve enrichments,” with approval routing and audit trails.
        </p>
        <p>
          So the extraction cost fell by 80–90% and the review cost did not move. A data steward who spends nine seconds
          per value — open the citation, glance, accept — needs <strong>375 hours</strong> to clear that afternoon’s
          output. What actually happens instead is that someone bulk-approves, the bad values reach the ERP and the
          webstore, a rep gets burned by a wrong voltage on a quote, and the next enrichment run doesn’t get approved at
          all. That is how an AI feature dies at the adoption stage rather than the launch stage.
        </p>
        <p className="cite">
          Sources: <a href="https://www.proton.ai/pim">proton.ai/pim</a> ·{" "}
          <a href="https://www.proton.ai/blog/proton-declares-war-on-bad-product-data-with-new-ai-pim-for-distributors">
            “Proton Declares War on Bad Product Data”
          </a>
        </p>
      </section>

      <h2 className="section">The solution</h2>
      <p className="section-note">
        Stop reviewing values. Review <em>error classes</em>. Every enrichment failure is one of a few dozen repeating
        shapes — a unit that wasn’t normalized, a manufacturer alias, a spec pulled off a marketplace listing instead of
        the maker’s own PDF. Group by <span className="cite">field × failure mode × source tier</span>, and one steward
        decision clears hundreds of rows <em>and</em> writes the rule that stops the class recurring. Below is one
        enrichment run — 830 SKUs pulled from a 4,100-SKU electrical catalog.
      </p>

      <Meters m={model} classCount={CLASSES.length} />
      <LaneBar totals={totals} total={TOTAL} />

      <h2 className="section">Queue — {CLASSES.length} classes, {TOTAL.toLocaleString("en-US")} values</h2>
      <p className="section-note">
        Open the evidence on any class to see the rows and where each value came from. Decisions are live: the meters
        above move as you work.
      </p>
      <div className="stack">
        {CLASSES.map((c) => (
          <ClassCard
            key={c.id}
            c={c}
            lane={currentLane(c, state)}
            decision={state.decided[c.id]}
            open={Boolean(open[c.id])}
            onToggle={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}
            onAct={(a) => setState((s) => decide(s, c, a, RULES))}
            onUndo={() => setState((s) => undo(s, c.id))}
          />
        ))}
      </div>

      <h2 className="section">Rules written from your decisions</h2>
      <p className="section-note">
        This is the part that compounds. A rejection isn’t a correction to one row — it is a policy the next run
        inherits, so the class arrives pre-sorted instead of arriving again.
      </p>
      <div className="ledger">
        {state.rules.length ? (
          state.rules.map((r, i) => (
            <div className="rule" key={r.classId}>
              <div className="rule-n">R{String(i + 1).padStart(2, "0")}</div>
              <div className="rule-b">
                <div className="rule-t">{r.rule}</div>
                <div className="rule-s">{r.effect}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="ledger-empty">
            No rules yet. Decide a class above and the rule it implies is written here — scoped, reversible, and
            inherited by the next enrichment run.
          </div>
        )}
      </div>

      <section className="closing">
        <h2>Rollout plan</h2>
        <p>The prototype shows the approach. Rolling it out safely takes five steps:</p>
        <ol className="ol">
          <li>
            <strong>Instrument the review step first.</strong>
            <span>
              Before shipping anything: time-to-decision per value, bulk-approve rate, and post-approval correction rate
              per customer. If stewards are bulk-approving above some threshold, the audit trail is theater, and that
              number should be known before designing around it.
            </span>
          </li>
          <li>
            <strong>Two design partners, four weeks, clustering only.</strong>
            <span>
              Ship the grouping with no automation at all — same queue, same manual decisions, just sorted by class. If
              review hours don’t drop on clustering alone, auto-accept won’t save it, and that lesson costs one sprint.
            </span>
          </li>
          <li>
            <strong>Earn the auto-accept lane with a measured precision floor.</strong>
            <span>
              Turn it on per class, per customer, only after the audit sample holds above the floor for two runs.
              Precision on the cleared lane is the number the roadmap lives or dies on — a steward who finds one bad
              auto-accepted value stops trusting all of them.
            </span>
          </li>
          <li>
            <strong>Make held rows a feature, not a failure.</strong>
            <span>
              Country of origin, tariff classification, safety listings: the product should refuse to guess and say why.
              “We will not auto-fill your customs data” is a sentence sales can use in a room, and it’s the reason the
              other {initialAutoPct}% is trustworthy.
            </span>
          </li>
          <li>
            <strong>Lead with the leverage metric, not the accuracy metric.</strong>
            <span>
              “Values cleared per steward decision” is the number a VP of Operations feels. Accuracy is table stakes;
              throughput is the purchase.
            </span>
          </li>
        </ol>
      </section>

      <footer>
        <p>
          Harsh Agarwal · Data is synthetic — modeled on electrical and industrial distribution catalogs (NEMA enclosure
          ratings, AWG conductor sizes, UNSPSC classification, UL/CSA listings), not on any Proton customer data. Every
          figure attributed to Proton is drawn from their public marketing and press coverage and linked above. Not
          affiliated with or endorsed by Proton.
        </p>
      </footer>
    </div>
  );
}
