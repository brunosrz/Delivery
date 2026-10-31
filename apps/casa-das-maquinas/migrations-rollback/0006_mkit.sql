-- Reverte 0006_mkit.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP INDEX IF EXISTS `mkit_materials_restaurant_idx`;
DROP TABLE IF EXISTS `mkit_materials`;
DELETE FROM d1_migrations WHERE name = '0006_mkit.sql';
