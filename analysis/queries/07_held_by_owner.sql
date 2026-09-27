-- Question: What is being held back from publication, and who has to own it?
SELECT
    c.field,
    c.values_count,
    c.source,
    r.rule_text AS standing_rule
FROM error_classes c
JOIN rules r ON r.class_id = c.class_id AND r.action = 'route'
WHERE c.lane = 'hold'
ORDER BY c.values_count DESC;
