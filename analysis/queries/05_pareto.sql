-- Question: How few decisions clear most of the run? (cumulative share, largest classes first)
SELECT
    class_id,
    lane,
    values_count,
    SUM(values_count) OVER (ORDER BY values_count DESC, class_id ROWS UNBOUNDED PRECEDING) AS cumulative_values,
    ROUND(100.0 * SUM(values_count) OVER (ORDER BY values_count DESC, class_id ROWS UNBOUNDED PRECEDING)
          / SUM(values_count) OVER (), 1)                                                  AS cumulative_pct,
    ROW_NUMBER() OVER (ORDER BY values_count DESC, class_id)                               AS decisions
FROM error_classes
WHERE lane <> 'hold'
ORDER BY decisions;
