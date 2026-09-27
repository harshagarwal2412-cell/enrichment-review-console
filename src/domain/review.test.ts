import { describe, expect, it } from "vitest";
import { CLASSES, RULES } from "./catalog";
import {
  INITIAL_STATE,
  actionsFor,
  costModel,
  currentLane,
  decide,
  formatHours,
  laneTotals,
  totalRows,
  undo,
} from "./review";

const byId = (id: string) => {
  const c = CLASSES.find((x) => x.id === id);
  if (!c) throw new Error(id);
  return c;
};

describe("catalog", () => {
  it("has 15 classes totalling 11,087 values", () => {
    expect(CLASSES).toHaveLength(15);
    expect(totalRows(CLASSES)).toBe(11087);
  });

  it("has unique ids and a rule for every action each lane offers", () => {
    expect(new Set(CLASSES.map((c) => c.id)).size).toBe(CLASSES.length);
    for (const c of CLASSES) {
      const { primary, secondary } = actionsFor(c.lane);
      expect(RULES[c.id]?.[primary], `${c.id}.${primary}`).toBeTruthy();
      expect(RULES[c.id]?.[secondary], `${c.id}.${secondary}`).toBeTruthy();
    }
  });

  it("never puts an uncorroborated tier-3 source in the auto lane", () => {
    for (const c of CLASSES.filter((x) => x.lane === "auto")) {
      expect(c.tier).toBe(1);
      expect(c.corrob).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("lanes", () => {
  it("starts with 66% of values cleared by policy", () => {
    const t = laneTotals(CLASSES, INITIAL_STATE);
    expect(Math.round((t.auto / totalRows(CLASSES)) * 100)).toBe(66);
  });

  it("demoting moves a class to review; routing moves it to hold", () => {
    let s = decide(INITIAL_STATE, byId("volt"), "demote", RULES);
    expect(currentLane(byId("volt"), s)).toBe("review");
    s = decide(s, byId("schema"), "route", RULES);
    expect(currentLane(byId("schema"), s)).toBe("hold");
  });

  it("lane totals always sum to the run size", () => {
    let s = INITIAL_STATE;
    for (const c of CLASSES) s = decide(s, c, actionsFor(c.lane).secondary, RULES);
    const t = laneTotals(CLASSES, s);
    expect(t.auto + t.review + t.hold).toBe(totalRows(CLASSES));
  });
});

describe("decisions and the rule ledger", () => {
  it("writes the implied rule once and ignores repeat decisions", () => {
    let s = decide(INITIAL_STATE, byId("upc"), "accept", RULES);
    s = decide(s, byId("upc"), "demote", RULES);
    expect(s.rules).toHaveLength(1);
    expect(s.rules[0].rule).toContain("check digit");
    expect(s.decided.upc).toBe("accept");
  });

  it("undo removes the decision and its rule without touching others", () => {
    let s = decide(INITIAL_STATE, byId("coo"), "route", RULES);
    s = decide(s, byId("mfr"), "accept", RULES);
    s = undo(s, "coo");
    expect(s.decided.coo).toBeUndefined();
    expect(s.rules.map((r) => r.classId)).toEqual(["mfr"]);
  });

  it("does not mutate the previous state", () => {
    const before = structuredClone(INITIAL_STATE);
    decide(INITIAL_STATE, byId("volt"), "accept", RULES);
    expect(INITIAL_STATE).toEqual(before);
  });
});

describe("cost model", () => {
  it("row-by-row review of the run takes ~27.7 hours at 9 s/value", () => {
    expect(formatHours(costModel(CLASSES, INITIAL_STATE).baselineSec)).toBe("27.7 hr");
  });

  it("class-based review is at least 10x cheaper", () => {
    const m = costModel(CLASSES, INITIAL_STATE);
    expect(m.baselineSec / m.triagedSec).toBeGreaterThan(10);
  });

  it("the audit sample shrinks when a class is demoted out of the cleared lane", () => {
    const before = costModel(CLASSES, INITIAL_STATE).auditRows;
    const after = costModel(CLASSES, decide(INITIAL_STATE, byId("volt"), "demote", RULES)).auditRows;
    expect(after).toBeLessThan(before);
  });

  it("formats large durations without decimals", () => {
    expect(formatHours(375 * 3600)).toBe("375 hr");
    expect(formatHours(5400)).toBe("1.5 hr");
  });
});
