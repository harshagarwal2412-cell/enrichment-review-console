import type { CostModel } from "../domain/review";
import { formatHours } from "../domain/review";
import type { Lane } from "../domain/types";

const n = (x: number) => x.toLocaleString("en-US");

export function Meters({ m, classCount }: { m: CostModel; classCount: number }) {
  const items: [string, string, string, string][] = [
    ["Values in this run", n(m.totalRows), "830 SKUs × ~13 fields", ""],
    ["Row-by-row review", formatHours(m.baselineSec), "at 9 sec per value", ""],
    ["Class-based review", formatHours(m.triagedSec), `${n(classCount)} decisions + ${n(m.auditRows)}-row audit`, "hero"],
    ["Values per decision", n(Math.round(m.leverage)), "cleared per steward call", ""],
  ];
  return (
    <div className="meters">
      {items.map(([k, v, s, cl]) => (
        <div key={k} className={`meter ${cl}`.trim()}>
          <div className="k">{k}</div>
          <div className="v">{v}</div>
          <div className="s">{s}</div>
        </div>
      ))}
    </div>
  );
}

export function LaneBar({ totals, total }: { totals: Record<Lane, number>; total: number }) {
  return (
    <>
      <div className="lanebar">
        {(["auto", "review", "hold"] as Lane[]).map((l) => {
          const pct = Math.round((totals[l] / total) * 100);
          return (
            <div key={l} className={`seg-${l}`} style={{ flex: `${totals[l]} 0 0` }}>
              {pct >= 8 ? `${n(totals[l])} · ${pct}%` : ""}
            </div>
          );
        })}
      </div>
      <div className="lanekey">
        <span>
          <i className="dot" style={{ background: "var(--cleared)" }} /> Cleared by policy — deterministic transform,
          tier-1 corroborated. 2% sampled for audit.
        </span>
        <span>
          <i className="dot" style={{ background: "var(--review)" }} /> Steward decision — needs a judgment call, one per
          class.
        </span>
        <span>
          <i className="dot" style={{ background: "var(--held)" }} /> Held — never auto-accepted. Routed to a named owner.
        </span>
      </div>
    </>
  );
}
