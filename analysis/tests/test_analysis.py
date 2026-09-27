"""SQL results are checked against the schema, against pandas, and against the figures the app shows."""
import sqlite3

import pytest

import pipeline


def test_run_shape(frames):
    c = frames["error_classes"]
    assert len(c) == 15
    assert c.values_count.sum() == 11_087
    assert len(frames["samples"]) == 45  # 3 evidence rows per class


def test_every_class_has_rules_for_the_actions_its_lane_offers(frames):
    offered = {"auto": {"accept", "demote"}, "review": {"accept", "route"}, "hold": {"route", "accept"}}
    rules = frames["rules"].groupby("class_id").action.apply(set)
    for _, c in frames["error_classes"].iterrows():
        assert offered[c.lane] <= rules[c.class_id], c.class_id


def test_schema_rejects_bad_rows(con):
    with pytest.raises(sqlite3.IntegrityError):
        con.execute("INSERT INTO rules VALUES ('nope', 'accept', 'x')")
    with pytest.raises(sqlite3.IntegrityError):
        con.execute("UPDATE error_classes SET lane = 'maybe' WHERE class_id = 'volt'")
    con.rollback()


def test_lane_mix_matches_pandas(con, frames):
    sql = pipeline.run(con, "01").set_index("lane")["values"]
    pd_ = frames["error_classes"].groupby("lane").values_count.sum()
    assert sql.to_dict() == pd_.to_dict()
    assert pipeline.run(con, "01").pct_of_values.sum() == pytest.approx(100, abs=0.2)


def test_cost_model_matches_the_app(con):
    """The web app shows 27.7 hr row-by-row, 1.4 hr class-based, a 147-row audit and 695 values per decision."""
    r = pipeline.run(con, "02").iloc[0]
    assert r.row_by_row_hours == 27.7
    assert r.class_based_hours == 1.4
    assert r.audit_rows == 147
    assert r.values_per_decision == 695


def test_no_class_breaks_the_trust_policy(con):
    assert pipeline.run(con, "04").empty


def test_untrusted_sources_never_reach_auto(con):
    m = pipeline.run(con, "03").set_index("source_tier")
    assert m.loc[2, "auto"] == 0 and m.loc[3, "auto"] == 0
    assert (m.auto + m.review + m.hold == m.total).all()


def test_pareto_is_cumulative_and_ends_at_100(con):
    p = pipeline.run(con, "05")
    assert p.cumulative_values.is_monotonic_increasing
    assert p.cumulative_pct.iloc[-1] == 100.0
    assert (p.cumulative_pct >= 80).idxmax() + 1 == 8  # 8 decisions clear 80% of reviewable values


def test_held_classes_all_have_a_standing_rule(con, frames):
    held = pipeline.run(con, "07")
    assert len(held) == (frames["error_classes"].lane == "hold").sum()
    assert held.standing_rule.str.startswith("NEVER").all()


def test_every_query_has_a_question_and_runs(con):
    import pandas as pd

    for q in pipeline.load_queries():
        assert q.question, q.key
        pd.read_sql_query(q.sql, con)
