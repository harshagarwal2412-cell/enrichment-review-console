-- Question: How many steward hours does row-by-row review cost vs. one decision per class?
-- Class-based cost = one decision per class + an audit sample of the auto-cleared lane.
WITH p AS (
    SELECT
        MAX(CASE WHEN param = 'sec_per_row'   THEN value END) AS sec_per_row,
        MAX(CASE WHEN param = 'sec_per_class' THEN value END) AS sec_per_class,
        MAX(CASE WHEN param = 'audit_rate'    THEN value END) AS audit_rate
    FROM cost_params
),
run AS (
    SELECT
        COUNT(*)                                                 AS classes,
        SUM(values_count)                                        AS total_values,
        SUM(CASE WHEN lane = 'auto' THEN values_count ELSE 0 END)   AS auto_values,
        SUM(CASE WHEN lane <> 'hold' THEN values_count ELSE 0 END)  AS steward_cleared
    FROM error_classes
)
SELECT
    run.total_values,
    ROUND(run.total_values * p.sec_per_row / 3600.0, 1)                          AS row_by_row_hours,
    CAST(ROUND(run.auto_values * p.audit_rate) AS INTEGER)                       AS audit_rows,
    ROUND((run.classes * p.sec_per_class
           + ROUND(run.auto_values * p.audit_rate) * p.sec_per_row) / 3600.0, 1) AS class_based_hours,
    ROUND(1.0 * run.steward_cleared / run.classes, 0)                            AS values_per_decision
FROM run, p;
