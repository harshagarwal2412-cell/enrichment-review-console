-- Enrichment Review Console: one AI enrichment run, grouped into error classes.

CREATE TABLE error_classes (
    class_id               TEXT PRIMARY KEY,
    lane                   TEXT NOT NULL CHECK (lane IN ('auto', 'review', 'hold')),
    field                  TEXT NOT NULL,
    failure_mode           TEXT NOT NULL,
    source                 TEXT NOT NULL,
    source_tier            INTEGER NOT NULL CHECK (source_tier BETWEEN 1 AND 3),
    corroborating_sources  INTEGER NOT NULL CHECK (corroborating_sources >= 0),
    values_count           INTEGER NOT NULL CHECK (values_count > 0),
    title                  TEXT NOT NULL
);

-- Evidence rows a steward samples before deciding a class
CREATE TABLE samples (
    class_id        TEXT NOT NULL REFERENCES error_classes (class_id),
    sample_no       INTEGER NOT NULL,
    sku             TEXT NOT NULL,
    product         TEXT NOT NULL,
    current_value   TEXT NOT NULL,
    proposed_value  TEXT NOT NULL,
    citation        TEXT NOT NULL,
    citation_tier   INTEGER NOT NULL CHECK (citation_tier BETWEEN 1 AND 3),
    PRIMARY KEY (class_id, sample_no)
);

-- The policy each decision writes
CREATE TABLE rules (
    class_id   TEXT NOT NULL REFERENCES error_classes (class_id),
    action     TEXT NOT NULL CHECK (action IN ('accept', 'demote', 'route')),
    rule_text  TEXT NOT NULL,
    PRIMARY KEY (class_id, action)
);

-- Cost-model assumptions
CREATE TABLE cost_params (
    param  TEXT PRIMARY KEY,
    value  REAL NOT NULL
);
