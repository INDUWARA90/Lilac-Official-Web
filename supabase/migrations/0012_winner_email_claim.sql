-- ============================================================================
-- Lilac — add a "sending" state to winners.email_status so the auto-send
-- (after a draw) and a manual "Resend" click can't race and double-send the
-- same winner's email. Apply after 0001-0011.
--
-- Postgres can't add an enum value inside the same transaction it's used in,
-- so this is its own statement/migration.
-- ============================================================================

alter type email_status add value if not exists 'sending';
