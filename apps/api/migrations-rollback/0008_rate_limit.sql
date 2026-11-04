-- Reverte 0008_rate_limit.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP INDEX IF EXISTS `rate_limit_window_idx`;
DROP TABLE IF EXISTS `rate_limit_buckets`;
DELETE FROM d1_migrations WHERE name = '0008_rate_limit.sql';
