-- Question: How much of the run can be cleared by policy, and how much needs a human?
SELECT
    lane,
    COUNT(*)                                                              AS classes,
    SUM(values_count)                                                     AS "values",
    ROUND(100.0 * SUM(values_count) / SUM(SUM(values_count)) OVER (), 1)  AS pct_of_values
FROM error_classes
GROUP BY lane
ORDER BY CASE lane WHEN 'auto' THEN 1 WHEN 'review' THEN 2 ELSE 3 END;
