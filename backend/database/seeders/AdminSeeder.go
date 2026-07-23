package seeders

// AdminSeederSQL creates the first owner-level pengguna row, linked to a
// real Supabase Auth user. The __AUTH_USER_ID__ placeholder is substituted
// by cmd/seed with the ADMIN_AUTH_USER_ID environment variable at run time
// (create the auth user via the Supabase dashboard/CLI first, then set the
// env var to its UUID before running the seeder).
var AdminSeederSQL = `
INSERT INTO pengguna (auth_user_id, nama_lengkap, username, email, role_id, status)
SELECT '__AUTH_USER_ID__'::uuid, 'Owner Apotek', 'owner', 'admin@gmail.com', r.id, 'aktif'
FROM role r
WHERE r.kode = 'owner'
ON CONFLICT (email) WHERE email IS NOT NULL DO NOTHING;

INSERT INTO pengguna_cabang (pengguna_id, cabang_id, default_cabang)
SELECT p.id, c.id, TRUE
FROM pengguna p
CROSS JOIN cabang c
WHERE p.email = 'admin@gmail.com' AND c.kode = '123456'
ON CONFLICT (pengguna_id, cabang_id) DO NOTHING;`
