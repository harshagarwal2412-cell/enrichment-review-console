-- Question: How does source trust map to review lane? (tier × lane pivot, in values)
SELECT
    source_tier,
    SUM(CASE WHEN lane = 'auto'   THEN values_count ELSE 0 END) AS auto,
    SUM(CASE WHEN lane = 'review' THEN values_count ELSE 0 END) AS review,
    SUM(CASE WHEN lane = 'hold'   THEN values_count ELSE 0 END) AS hold,
    SUM(values_count)                                           AS total
FROM error_classes
GROUP BY source_tier
ORDER BY source_tier;
