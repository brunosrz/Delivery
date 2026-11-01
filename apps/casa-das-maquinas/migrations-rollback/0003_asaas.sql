-- Reverte 0003_asaas.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP INDEX IF EXISTS `payment_charges_order_unique`;
DROP INDEX IF EXISTS `payment_charges_provider_charge_unique`;
DROP TABLE IF EXISTS `asaas_customers`;
DROP TABLE IF EXISTS `payment_charges`;
DROP TABLE IF EXISTS `payment_webhook_events`;
DELETE FROM d1_migrations WHERE name = '0003_asaas.sql';
