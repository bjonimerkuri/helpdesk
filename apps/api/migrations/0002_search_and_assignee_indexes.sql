-- Trigram indexes make the ILIKE '%term%' ticket search use an index instead of a seq scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_tickets_title_trgm ON tickets USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tickets_description_trgm ON tickets USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
