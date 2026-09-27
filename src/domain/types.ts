/**
 * Review lanes:
 *  - auto:   cleared by policy (deterministic transform, tier-1 corroborated), audit-sampled
 *  - review: needs one steward judgment call per class
 *  - hold:   never auto-accepted; routed to a named owner
 */
export type Lane = "auto" | "review" | "hold";

/** Source trust tier: 1 = manufacturer/registry of record, 2 = derived, 3 = untrusted. */
export type Tier = 1 | 2 | 3;

export type Action = "accept" | "demote" | "route";

export interface Sample {
  sku: string;
  product: string;
  current: string;
  proposed: string;
  source: string;
  tier: number;
}

/** A group of enrichment values that share one field × failure mode × source tier. */
export interface ErrorClass {
  id: string;
  lane: Lane;
  field: string;
  rows: number;
  title: string;
  failure: string;
  src: string;
  tier: number;
  /** Number of independent corroborating sources. */
  corrob: number;
  why: string;
  samples: Sample[];
}

export type RuleBook = Record<string, Partial<Record<Action, string>>>;

export interface WrittenRule {
  classId: string;
  action: Action;
  rule: string;
  effect: string;
}

export interface ReviewState {
  decided: Record<string, Action>;
  rules: WrittenRule[];
}
