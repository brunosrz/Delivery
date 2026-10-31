-- Reverte 0005_contact.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP INDEX IF EXISTS `contact_messages_ip_created_idx`;
DROP TABLE IF EXISTS `contact_messages`;
DELETE FROM d1_migrations WHERE name = '0005_contact.sql';
