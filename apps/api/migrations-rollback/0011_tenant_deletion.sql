-- Reverte 0011_tenant_deletion.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
ALTER TABLE `restaurants` DROP COLUMN `deleted_at`;
ALTER TABLE `restaurants` DROP COLUMN `purged_at`;
DELETE FROM d1_migrations WHERE name = '0011_tenant_deletion.sql';
