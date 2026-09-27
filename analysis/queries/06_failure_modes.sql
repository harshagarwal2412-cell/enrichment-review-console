-- Question: Which failure modes generate the most volume, and are they deterministic fixes?
SELECT
    failure_mode,
    COUNT(*)                        AS classes,
    SUM(values_count)               AS "values",
    GROUP_CONCAT(DISTINCT lane)     AS lanes,
    GROUP_CONCAT(field, '; ')       AS fields
FROM error_classes
GROUP BY failure_mode
ORDER BY "values" DESC;
