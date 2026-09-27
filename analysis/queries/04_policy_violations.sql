-- Question: Does any class in the auto lane break the trust policy? (expected: no rows)
-- Policy: auto-accept only for tier-1 sources with at least 2 corroborating sources,
-- and every sample shown as evidence must carry a tier-1 citation.
SELECT c.class_id, c.title, c.source_tier, c.corroborating_sources,
       MAX(s.citation_tier) AS worst_sample_tier
FROM error_classes c
JOIN samples s USING (class_id)
WHERE c.lane = 'auto'
GROUP BY c.class_id
HAVING c.source_tier > 1 OR c.corroborating_sources < 2 OR MAX(s.citation_tier) > 1;
