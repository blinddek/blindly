-- Add 'supplier' to markup_config scope_type so per-supplier markups can be stored

ALTER TABLE markup_config DROP CONSTRAINT IF EXISTS markup_config_scope_type_check;

ALTER TABLE markup_config
  ADD CONSTRAINT markup_config_scope_type_check
  CHECK (scope_type IN ('global', 'category', 'type', 'range', 'supplier'));
