import { actionsFor } from "../domain/review";
import type { Action, ErrorClass, Lane } from "../domain/types";

const n = (x: number) => x.toLocaleString("en-US");

const PILL: Record<Lane, string> = {
  auto: "Cleared by policy",
  review: "Steward decision",
  hold: "Held — no auto-accept",
};

const OUTCOME: Record<Action, { text: (c: ErrorClass) => string; warn: boolean }> = {
  accept: { text: (c) => `✓ ${n(c.rows)} values written to ERP + webstore`, warn: false },
  demote: { text: () => "⚠ Class demoted — auto-accept off for this source", warn: true },
  route: { text: () => "→ Routed to the product data owner with citations", warn: true },
};

function buttonLabel(lane: Lane, action: Action, rows: number): string {
  if (lane === "auto") return action === "accept" ? "Confirm policy & write" : "Reject — stop auto-accepting this";
  if (lane === "review") return action === "accept" ? `Decide once for all ${n(rows)}` : "Escalate to owner";
  return action === "route" ? "Assign owner & keep held" : "Override — accept anyway";
}

interface Props {
  c: ErrorClass;
  lane: Lane;
  decision?: Action;
  open: boolean;
  onToggle: () => void;
  onAct: (a: Action) => void;
  onUndo: () => void;
}

export function ClassCard({ c, lane, decision, open, onToggle, onAct, onUndo }: Props) {
  const { primary, secondary } = actionsFor(lane);
  return (
    <article className={`cls ${decision ? "resolved" : ""}`.trim()} data-lane={lane}>
      <div className="cls-head">
        <div className="stripe" />
        <div className="cls-main">
          <div className="cls-title">{c.title}</div>
          <div className="cls-meta">
            <span>{c.field}</span>
            <span>failure: {c.failure}</span>
            <span>source: {c.src}</span>
            <span>
              tier {c.tier}
              {c.corrob ? ` · ${c.corrob} corroborating` : " · uncorroborated"}
            </span>
          </div>
          <div className="cls-why">{c.why}</div>
        </div>
        <div className="cls-right">
          <div className="count">
            {n(c.rows)}
            <small>values</small>
          </div>
          <span className={`pill pill-${lane}`}>{PILL[lane]}</span>
        </div>
      </div>

      {open && <Evidence c={c} />}

      <div className="cls-foot">
        <button onClick={onToggle}>{open ? "Hide evidence" : "Show evidence"}</button>
        {decision ? (
          <button className="link" onClick={onUndo}>
            Undo
          </button>
        ) : (
          <>
            <button className="primary" onClick={() => onAct(primary)}>
              {buttonLabel(lane, primary, c.rows)}
            </button>
            <button onClick={() => onAct(secondary)}>{buttonLabel(lane, secondary, c.rows)}</button>
          </>
        )}
        {decision && (
          <div className={`outcome ${OUTCOME[decision].warn ? "warn" : ""}`.trim()}>{OUTCOME[decision].text(c)}</div>
        )}
      </div>
    </article>
  );
}

function Evidence({ c }: { c: ErrorClass }) {
  return (
    <div className="evidence">
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th>Current</th>
            <th>Proposed</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {c.samples.map((s) => (
            <tr key={s.sku + s.proposed}>
              <td className="m">{s.sku}</td>
              <td>{s.product}</td>
              <td className="m">
                <span className="was">{s.current}</span>
              </td>
              <td className="m">
                <span className="now">{s.proposed}</span>
              </td>
              <td className="src">
                <span className={`tier t${s.tier}`}>T{s.tier}</span>
                {s.source}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={5} className="src" style={{ paddingTop: 8 }}>
              3 of {n(c.rows)} shown — the steward samples, the sample is logged, the decision covers the class.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
