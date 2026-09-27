import type { Action, ErrorClass, Lane, ReviewState, RuleBook } from "./types";

/** Cost-model constants. */
export const SEC_PER_ROW = 9; // steward opens citation, glances, accepts
export const SEC_PER_CLASS = 240; // steward samples ~6 rows and decides once
export const AUDIT_RATE = 0.02; // sampled share of the cleared lane

export const LANES: Lane[] = ["auto", "review", "hold"];

export const INITIAL_STATE: ReviewState = { decided: {}, rules: [] };

/** Which actions are offered for a class, given the lane it is currently in. */
export function actionsFor(lane: Lane): { primary: Action; secondary: Action } {
  switch (lane) {
    case "auto":
      return { primary: "accept", secondary: "demote" };
    case "review":
      return { primary: "accept", secondary: "route" };
    case "hold":
      return { primary: "route", secondary: "accept" };
  }
}

/** A decision can move a class between lanes: demote → review, route → hold. */
export function currentLane(c: ErrorClass, state: ReviewState): Lane {
  const d = state.decided[c.id];
  if (d === "demote") return "review";
  if (d === "route") return "hold";
  return c.lane;
}

export function laneTotals(classes: ErrorClass[], state: ReviewState): Record<Lane, number> {
  const t: Record<Lane, number> = { auto: 0, review: 0, hold: 0 };
  for (const c of classes) t[currentLane(c, state)] += c.rows;
  return t;
}

export const totalRows = (classes: ErrorClass[]): number => classes.reduce((a, c) => a + c.rows, 0);

export interface CostModel {
  totalRows: number;
  auditRows: number;
  /** Seconds to review every value one at a time. */
  baselineSec: number;
  /** Seconds with one decision per class plus an audit sample of the cleared lane. */
  triagedSec: number;
  /** Values cleared per steward decision (held rows leave the steward's queue). */
  leverage: number;
}

/**
 * Every class costs one steward decision; the cleared lane still costs an audit
 * sample; review-lane rows are cleared by the class decision itself; held rows
 * leave the steward queue for a named owner.
 */
export function costModel(classes: ErrorClass[], state: ReviewState): CostModel {
  const t = laneTotals(classes, state);
  const rows = totalRows(classes);
  const auditRows = Math.round(t.auto * AUDIT_RATE);
  return {
    totalRows: rows,
    auditRows,
    baselineSec: rows * SEC_PER_ROW,
    triagedSec: classes.length * SEC_PER_CLASS + auditRows * SEC_PER_ROW,
    leverage: classes.length ? (t.auto + t.review) / classes.length : 0,
  };
}

const n = (x: number) => x.toLocaleString("en-US");

export const EFFECT: Record<Action, (c: ErrorClass) => string> = {
  accept: (c) => `${n(c.rows)} values written. Next run inherits this policy and skips the queue.`,
  demote: (c) =>
    `${n(c.rows)} values moved to the steward queue. Auto-accept stays off until the audit sample clears twice.`,
  route: (c) => `${n(c.rows)} values held with citations attached. Owner notified; nothing reaches the ERP.`,
};

/** Record a decision and append the policy it implies to the rule ledger. Pure: returns new state. */
export function decide(state: ReviewState, c: ErrorClass, action: Action, rules: RuleBook): ReviewState {
  if (state.decided[c.id]) return state;
  const rule = rules[c.id]?.[action];
  return {
    decided: { ...state.decided, [c.id]: action },
    rules: rule ? [...state.rules, { classId: c.id, action, rule, effect: EFFECT[action](c) }] : state.rules,
  };
}

/** Reverse a decision and drop the rule it wrote. */
export function undo(state: ReviewState, classId: string): ReviewState {
  if (!state.decided[classId]) return state;
  const decided = { ...state.decided };
  delete decided[classId];
  return { decided, rules: state.rules.filter((r) => r.classId !== classId) };
}

export function formatHours(sec: number): string {
  const h = sec / 3600;
  return h >= 100 ? `${Math.round(h)} hr` : `${h.toFixed(1)} hr`;
}
