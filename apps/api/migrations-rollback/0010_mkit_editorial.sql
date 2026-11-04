-- Reverte 0010_mkit_editorial.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP INDEX IF EXISTS `mkit_calendar_restaurant_idx`;
DROP INDEX IF EXISTS `mkit_categories_restaurant_idx`;
DROP INDEX IF EXISTS `mkit_categories_name_unique`;
ALTER TABLE `mkit_materials` DROP COLUMN `medium`;
ALTER TABLE `mkit_materials` DROP COLUMN `category_id`;
ALTER TABLE `mkit_materials` DROP COLUMN `deleted_at`;
DROP TABLE IF EXISTS `mkit_calendar_events`;
DROP TABLE IF EXISTS `mkit_categories`;
DELETE FROM d1_migrations WHERE name = '0010_mkit_editorial.sql';
