/**
 * Exports the enrichment run to CSV for the Python/SQL analysis in /analysis.
 * The TypeScript catalog is the single source of truth.
 *
 *   npm run export:data
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CLASSES, RULES } from "../src/domain/catalog";
import { AUDIT_RATE, SEC_PER_CLASS, SEC_PER_ROW } from "../src/domain/review";

const OUT = join(import.meta.dirname, "..", "analysis", "data");
mkdirSync(OUT, { recursive: true });

type Row = Record<string, string | number | boolean | undefined | null>;
const cell = (v: Row[string]) => {
  if (v === undefined || v === null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function write(name: string, rows: Row[]) {
  const cols = Object.keys(rows[0]);
  writeFileSync(join(OUT, name), [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n") + "\n");
  console.log(`wrote ${name} (${rows.length} rows)`);
}

write("error_classes.csv", CLASSES.map((c) => ({
  class_id: c.id, lane: c.lane, field: c.field, failure_mode: c.failure, source: c.src,
  source_tier: c.tier, corroborating_sources: c.corrob, values_count: c.rows, title: c.title,
})));

write("samples.csv", CLASSES.flatMap((c) => c.samples.map((s, i) => ({
  class_id: c.id, sample_no: i + 1, sku: s.sku, product: s.product, current_value: s.current,
  proposed_value: s.proposed, citation: s.source, citation_tier: s.tier,
}))));

write("rules.csv", Object.entries(RULES).flatMap(([classId, byAction]) =>
  Object.entries(byAction).map(([action, rule]) => ({ class_id: classId, action, rule_text: rule })),
));

write("cost_params.csv", [
  { param: "sec_per_row", value: SEC_PER_ROW },
  { param: "sec_per_class", value: SEC_PER_CLASS },
  { param: "audit_rate", value: AUDIT_RATE },
]);
