-- Reverte 0009_privacy.sql. Gerado por scripts/generate-rollbacks.mjs; não edite à mão.
DROP INDEX IF EXISTS `consent_records_consent_idx`;
DROP INDEX IF EXISTS `consent_records_user_idx`;
DROP INDEX IF EXISTS `consent_records_created_idx`;
DROP INDEX IF EXISTS `data_requests_subject_idx`;
DROP INDEX IF EXISTS `legal_acceptances_unique`;
DROP TABLE IF EXISTS `consent_records`;
DROP TABLE IF EXISTS `data_requests`;
DROP TABLE IF EXISTS `legal_acceptances`;
DELETE FROM d1_migrations WHERE name = '0009_privacy.sql';
