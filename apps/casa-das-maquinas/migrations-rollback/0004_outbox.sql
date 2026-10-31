-- Reverte 0004_outbox.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP INDEX IF EXISTS `outbox_jobs_status_created_idx`;
DROP INDEX IF EXISTS `outbox_jobs_order_idx`;
DROP TABLE IF EXISTS `outbox_jobs`;
DELETE FROM d1_migrations WHERE name = '0004_outbox.sql';
