-- Coordinate restoring the previous application completion flow first.
-- Preserves all member/consent data and the existing complete_signup function.
begin;
drop trigger store_member_on_email_confirmation on auth.users;
drop trigger store_member_on_auth_signup on auth.users;
drop function private.sync_store_email_confirmation();
drop function private.register_store_member();
commit;
