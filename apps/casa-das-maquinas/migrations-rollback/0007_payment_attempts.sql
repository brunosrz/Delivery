-- Reverte 0007_payment_attempts.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP TABLE IF EXISTS `payment_attempts`;
DELETE FROM d1_migrations WHERE name = '0007_payment_attempts.sql';
