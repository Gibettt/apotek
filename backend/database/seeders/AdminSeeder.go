package seeders

var AdminSeederSQL = `
-- User utama dibuat lewat Supabase Auth.
-- Insert profile extension setelah UUID Supabase tersedia.
INSERT INTO users (id, name, email, role_id, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Owner Apotek', 'owner@apotek.local', 1, TRUE)
ON CONFLICT (email) DO NOTHING;`
