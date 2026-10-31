-- Reverte 0001_auth.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP INDEX IF EXISTS `account_user_idx`;
DROP INDEX IF EXISTS `restaurant_members_restaurant_idx`;
DROP INDEX IF EXISTS `session_token_unique`;
DROP INDEX IF EXISTS `session_user_idx`;
DROP INDEX IF EXISTS `user_email_unique`;
DROP INDEX IF EXISTS `verification_identifier_idx`;
DROP TABLE IF EXISTS `account`;
DROP TABLE IF EXISTS `restaurant_members`;
DROP TABLE IF EXISTS `session`;
DROP TABLE IF EXISTS `verification`;
DROP TABLE IF EXISTS `user`;
DELETE FROM d1_migrations WHERE name = '0001_auth.sql';
