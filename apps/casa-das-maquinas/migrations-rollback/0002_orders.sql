-- Reverte 0002_orders.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP INDEX IF EXISTS `order_events_order_idx`;
DROP INDEX IF EXISTS `orders_customer_idempotency_unique`;
DROP INDEX IF EXISTS `orders_restaurant_created_idx`;
DROP INDEX IF EXISTS `orders_customer_created_idx`;
DROP TABLE IF EXISTS `order_events`;
DROP TABLE IF EXISTS `orders`;
DELETE FROM d1_migrations WHERE name = '0002_orders.sql';
