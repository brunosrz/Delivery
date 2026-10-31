-- Reverte 0000_catalog.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP INDEX IF EXISTS `addon_groups_product_idx`;
DROP INDEX IF EXISTS `addon_options_group_idx`;
DROP INDEX IF EXISTS `menu_sections_restaurant_idx`;
DROP INDEX IF EXISTS `opening_hours_restaurant_idx`;
DROP INDEX IF EXISTS `products_restaurant_slug_unique`;
DROP INDEX IF EXISTS `products_section_idx`;
DROP INDEX IF EXISTS `restaurants_slug_unique`;
DROP TABLE IF EXISTS `addon_options`;
DROP TABLE IF EXISTS `opening_hours`;
DROP TABLE IF EXISTS `addon_groups`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `menu_sections`;
DROP TABLE IF EXISTS `restaurants`;
DELETE FROM d1_migrations WHERE name = '0000_catalog.sql';
