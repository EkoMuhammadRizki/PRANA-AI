-- ════════════════════════════════════════════════════════════════════
-- Akun awal PRANA-AI — jalankan SETELAH 0001_init.sql berhasil.
--   analis@pranaai.com  → role 'analis'  (Lapis 1 + Lapis 2)
--   citizen@pranaai.com → role 'user'    (Lapis 1 saja)
-- Password keduanya: prana123$  — GANTI sebelum dipakai di lapangan.
-- Aman dijalankan ulang (akun yang sudah ada tidak dibuat dua kali).
-- ════════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto with schema extensions;

do $$
declare
  acc record;
  v_id uuid;
begin
  for acc in
    select * from (values
      ('analis@pranaai.com',  'Analis PRANA-AI',  'analis'::public.user_role),
      ('citizen@pranaai.com', 'Petugas Patroli',  'user'::public.user_role)
    ) as t(email, full_name, role)
  loop
    select id into v_id from auth.users where email = acc.email;

    if v_id is null then
      v_id := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
        acc.email, extensions.crypt('prana123$', extensions.gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', acc.full_name),
        now(), now(),
        '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_id, v_id::text, 'email',
        jsonb_build_object('sub', v_id::text, 'email', acc.email, 'email_verified', true),
        now(), now(), now()
      );
    end if;

    -- Trigger on_auth_user_created sudah membuat profil ber-role 'user'; tetapkan role akhir.
    insert into public.profiles (user_id, role, full_name)
    values (v_id, acc.role, acc.full_name)
    on conflict (user_id) do update set role = excluded.role, full_name = excluded.full_name;
  end loop;
end $$;

-- Cek hasil
select u.email, p.role, p.full_name
from auth.users u join public.profiles p on p.user_id = u.id
where u.email in ('analis@pranaai.com', 'citizen@pranaai.com');
