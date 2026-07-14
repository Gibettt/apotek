# Plan Aplikasi Web Apotek

## Tujuan

Membangun aplikasi web untuk membantu operasional apotek, mulai dari pengelolaan data obat, stok, pembelian, penjualan, resep, sampai laporan keuangan.

Tahap awal adalah landing page, dilanjutkan ke aplikasi utama berbasis role.

---

## Target Pengguna

- Owner apotek
- Admin
- Apoteker
- Kasir

---

## Stack Teknologi

### Frontend

| Layer       | Teknologi               | Keterangan                              |
|-------------|-------------------------|-----------------------------------------|
| Framework   | Next.js 14 (App Router) | SSR + SSG, routing, SEO-ready           |
| Language    | TypeScript              | Type-safe, lebih mudah di-maintain      |
| Styling     | Tailwind CSS            | Utility-first, konsisten               |
| State       | Zustand                 | State management ringan                |
| Fetching    | TanStack Query          | Server state, caching, refetching      |
| Form        | React Hook Form + Zod   | Validasi form + schema validation      |
| UI Library  | shadcn/ui               | Komponen siap pakai berbasis Radix UI  |
| Icons       | Lucide React            | Ikon modern dan konsisten              |
| Charts      | Recharts                | Grafik laporan dashboard               |
| Print       | react-to-print          | Cetak struk dari browser               |
| Toast       | Sonner                  | Notifikasi toast modern                |

### Backend

| Layer       | Teknologi          | Keterangan                              |
|-------------|--------------------|----------------------------------------|
| Framework   | Goravel            | Laravel-like framework untuk Go        |
| Language    | Go (Golang)        | Performa tinggi, concurrency baik      |
| Auth        | Supabase Auth      | JWT, OAuth, session management         |
| ORM         | Goravel ORM        | Bawaan Goravel, mirip Eloquent         |
| Validation  | Goravel Validation | Validasi request server-side           |
| Middleware  | Goravel HTTP       | Auth, CORS, logging, rate limit        |

### Database & Infrastruktur

| Layer           | Teknologi               | Keterangan                          |
|-----------------|-------------------------|-------------------------------------|
| Database        | Supabase (PostgreSQL)   | Cloud PostgreSQL, realtime, RLS     |
| Auth            | Supabase Auth           | Manajemen user & session            |
| Storage         | Supabase Storage        | Upload gambar obat, logo apotek     |
| Deployment      | VPS (Ubuntu)            | DigitalOcean / Vultr / Linode       |
| Reverse Proxy   | Nginx                   | Routing, HTTPS, load balancing      |
| SSL             | Let's Encrypt / Certbot | HTTPS gratis                        |
| Process Manager | PM2 + systemd           | Menjaga proses tetap berjalan       |
| CI/CD           | GitHub Actions          | Auto deploy saat push ke main       |

---

## Role dan Akses

### Owner

- Melihat dashboard utama
- Melihat seluruh laporan (penjualan, pembelian, stok, laba rugi)
- Melihat performa penjualan dan stok secara grafis
- Mengelola user (tambah, edit, nonaktifkan)
- Mengatur profil apotek

### Admin

- Mengelola data obat (CRUD + foto)
- Mengelola kategori obat
- Mengelola supplier
- Mengelola pelanggan
- Mencatat pembelian dari supplier
- Mengelola stok (masuk, keluar, opname)
- Melihat laporan

### Apoteker

- Melihat dan mengelola data obat
- Melihat stok real-time
- Mencatat dan memverifikasi resep dokter
- Melakukan stok opname
- Mendapat notifikasi stok menipis & obat expired

### Kasir

- Melakukan transaksi penjualan (dengan/tanpa resep)
- Mencetak struk
- Melihat riwayat transaksi sendiri
- Melihat stok obat (read-only)

---

## Struktur Halaman

```
/
  Landing page (publik)

/login
  Halaman login (Supabase Auth)

/dashboard
  Ringkasan: total penjualan hari ini, stok menipis, pembelian terbaru,
  grafik penjualan mingguan/bulanan, notifikasi penting

/obat
  /obat              -> daftar obat (tabel + search + filter + pagination)
  /obat/tambah       -> form tambah obat
  /obat/[id]         -> detail obat
  /obat/[id]/edit    -> form edit obat

/kategori
  /kategori          -> daftar kategori
  /kategori/tambah   -> form tambah
  /kategori/[id]/edit -> form edit

/supplier
  /supplier          -> daftar supplier
  /supplier/tambah   -> form tambah
  /supplier/[id]     -> detail supplier
  /supplier/[id]/edit -> form edit

/pelanggan
  /pelanggan         -> daftar pelanggan / pasien
  /pelanggan/tambah  -> form tambah
  /pelanggan/[id]    -> detail pelanggan + riwayat transaksi
  /pelanggan/[id]/edit -> form edit

/stok
  /stok              -> daftar stok semua obat (real-time)
  /stok/masuk        -> form stok masuk manual
  /stok/keluar       -> form stok keluar manual
  /stok/opname       -> halaman stok opname
  /stok/hampir-habis -> daftar obat di bawah stok minimum
  /stok/expired      -> daftar obat mendekati / sudah expired

/pembelian
  /pembelian         -> daftar pembelian dari supplier
  /pembelian/tambah  -> form buat PO baru (multi-item)
  /pembelian/[id]    -> detail pembelian + cetak PO

/penjualan
  /penjualan/kasir   -> halaman kasir (POS interface)
  /penjualan         -> riwayat semua transaksi penjualan
  /penjualan/[id]    -> detail penjualan + cetak struk

/resep
  /resep             -> daftar resep
  /resep/tambah      -> form input resep dokter
  /resep/[id]        -> detail resep
  /resep/[id]/proses -> konversi resep ke transaksi kasir

/laporan
  /laporan/penjualan -> laporan penjualan (filter tanggal, export PDF/Excel)
  /laporan/pembelian -> laporan pembelian
  /laporan/stok      -> laporan stok
  /laporan/laba-rugi -> laporan laba rugi

/notifikasi
  /notifikasi        -> semua notifikasi sistem (stok, expired, dll)

/users
  /users             -> daftar user
  /users/tambah      -> form tambah user + assign role
  /users/[id]/edit   -> edit user & role

/pengaturan
  /pengaturan/profil     -> profil apotek (nama, alamat, logo, SIPA)
  /pengaturan/struk      -> pengaturan format struk (header, footer, logo)
  /pengaturan/stok       -> pengaturan stok minimum default
  /pengaturan/notifikasi -> threshold notifikasi expired (30/60/90 hari)
```

---

## Struktur Folder Frontend (Next.js)

```
src/
  app/
    (auth)/
      login/
        page.tsx
    (dashboard)/
      layout.tsx             <- layout dengan sidebar & navbar
      dashboard/page.tsx
      obat/
        page.tsx
        tambah/page.tsx
        [id]/page.tsx
        [id]/edit/page.tsx
      kategori/...
      supplier/...
      pelanggan/...
      stok/...
      pembelian/...
      penjualan/
        kasir/page.tsx
        page.tsx
        [id]/page.tsx
      resep/...
      laporan/...
      notifikasi/page.tsx
      users/...
      pengaturan/...

  components/
    layout/
      Sidebar.tsx
      Navbar.tsx
      Header.tsx
      PageTitle.tsx
      Breadcrumb.tsx
    ui/
      Button.tsx
      Input.tsx
      Select.tsx
      Modal.tsx
      Table.tsx
      Badge.tsx
      Card.tsx
      Alert.tsx
      Pagination.tsx
      DateRangePicker.tsx
      SearchInput.tsx
      ConfirmDialog.tsx
      Skeleton.tsx
    forms/
      LoginForm.tsx
      ObatForm.tsx
      KategoriForm.tsx
      SupplierForm.tsx
      PelangganForm.tsx
      PembelianForm.tsx
      PenjualanForm.tsx
      ResepForm.tsx
      UserForm.tsx
      PengaturanForm.tsx
    dashboard/
      StatCard.tsx
      SalesChart.tsx
      LowStockAlert.tsx
      RecentTransactions.tsx
      ExpiredAlert.tsx
    kasir/
      KasirCart.tsx
      KasirSearch.tsx
      KasirPaymentModal.tsx
      KasirReceipt.tsx
    laporan/
      LaporanFilter.tsx
      LaporanTable.tsx
      ExportButton.tsx

  services/
    authService.ts
    obatService.ts
    kategoriService.ts
    supplierService.ts
    pelangganService.ts
    stokService.ts
    pembelianService.ts
    penjualanService.ts
    resepService.ts
    laporanService.ts
    userService.ts
    notifikasiService.ts
    pengaturanService.ts

  store/
    authStore.ts
    cartStore.ts         <- state keranjang kasir
    notifikasiStore.ts

  types/
    auth.ts
    user.ts
    obat.ts
    stok.ts
    pembelian.ts
    penjualan.ts
    resep.ts
    laporan.ts
    notifikasi.ts
    pengaturan.ts

  lib/
    supabase.ts          <- Supabase client
    apiClient.ts         <- Axios instance ke Goravel API
    queryClient.ts       <- TanStack Query client

  constants/
    menu.ts              <- navigasi sidebar per role
    roles.ts
    status.ts
    routes.ts

  utils/
    formatCurrency.ts
    formatDate.ts
    formatPhone.ts
    validation.ts
    printReceipt.ts
    exportExcel.ts
    exportPdf.ts

  hooks/
    useAuth.ts
    useDebounce.ts
    usePagination.ts
    useNotifikasi.ts
    useRoleGuard.ts
```

---

## Struktur Folder Backend (Goravel)

```
backend/
  app/
    http/
      controllers/
        AuthController.go
        ObatController.go
        KategoriController.go
        SupplierController.go
        PelangganController.go
        StokController.go
        PembelianController.go
        PenjualanController.go
        ResepController.go
        LaporanController.go
        UserController.go
        NotifikasiController.go
        PengaturanController.go
      middleware/
        AuthMiddleware.go      <- verifikasi JWT Supabase
        RoleMiddleware.go      <- cek permission per role
        LogMiddleware.go       <- logging request
        CorsMiddleware.go
      requests/
        ObatRequest.go
        PembelianRequest.go
        PenjualanRequest.go
        ResepRequest.go
        UserRequest.go
    models/
      User.go
      Role.go
      Obat.go
      KategoriObat.go
      Supplier.go
      Pelanggan.go
      Stok.go
      StokMutasi.go
      Pembelian.go
      PembelianDetail.go
      Penjualan.go
      PenjualanDetail.go
      Resep.go
      ResepDetail.go
      Notifikasi.go
      Setting.go
    services/
      ObatService.go
      StokService.go
      PenjualanService.go
      PembelianService.go
      ResepService.go
      LaporanService.go
      NotifikasiService.go

  routes/
    api.go

  database/
    migrations/
      001_create_users_table.go
      002_create_roles_table.go
      003_create_obat_table.go
      ...
    seeders/
      RoleSeeder.go
      AdminSeeder.go
      ObatSeeder.go

  config/
    app.go
    database.go
    auth.go
    cors.go

  storage/logs/
  .env
  .env.example
  go.mod
  go.sum
  main.go
```

---

## Skema Database (Supabase / PostgreSQL)

### users *(dikelola Supabase Auth, extended via tabel profiles)*

| Kolom      | Tipe         | Keterangan              |
|------------|--------------|-------------------------|
| id         | UUID (PK)    | dari Supabase Auth      |
| name       | VARCHAR(100) |                         |
| email      | VARCHAR(150) | UNIQUE                  |
| role_id    | INT (FK)     | relasi ke tabel roles   |
| status     | BOOLEAN      | aktif/nonaktif          |
| created_at | TIMESTAMP    |                         |
| updated_at | TIMESTAMP    |                         |

### roles

| Kolom       | Tipe        | Keterangan                          |
|-------------|-------------|-------------------------------------|
| id          | SERIAL (PK) |                                     |
| name        | VARCHAR(50) | owner, admin, apoteker, kasir       |
| description | TEXT        |                                     |

### kategori_obat

| Kolom      | Tipe         | Keterangan |
|------------|--------------|------------|
| id         | SERIAL (PK)  |            |
| nama       | VARCHAR(100) |            |
| deskripsi  | TEXT         |            |
| created_at | TIMESTAMP    |            |
| updated_at | TIMESTAMP    |            |

### obat

| Kolom             | Tipe           | Keterangan                       |
|-------------------|----------------|----------------------------------|
| id                | SERIAL (PK)    |                                  |
| kode_obat         | VARCHAR(50)    | UNIQUE                           |
| nama_obat         | VARCHAR(200)   |                                  |
| kategori_id       | INT (FK)       |                                  |
| supplier_id       | INT (FK)       |                                  |
| satuan            | VARCHAR(30)    | tablet, kapsul, botol, dll       |
| harga_beli        | DECIMAL(15,2)  |                                  |
| harga_jual        | DECIMAL(15,2)  |                                  |
| stok_minimum      | INT            | threshold notifikasi             |
| gambar_url        | TEXT           | URL dari Supabase Storage        |
| deskripsi         | TEXT           |                                  |
| golongan          | VARCHAR(50)    | bebas, bebas terbatas, keras     |
| membutuhkan_resep | BOOLEAN        | default false                    |
| status            | BOOLEAN        | aktif/nonaktif                   |
| created_at        | TIMESTAMP      |                                  |
| updated_at        | TIMESTAMP      |                                  |

### stok

| Kolom           | Tipe          | Keterangan             |
|-----------------|---------------|------------------------|
| id              | SERIAL (PK)   |                        |
| obat_id         | INT (FK)      |                        |
| batch_number    | VARCHAR(100)  |                        |
| tanggal_expired | DATE          |                        |
| jumlah          | INT           |                        |
| lokasi          | VARCHAR(100)  | rak/lokasi penyimpanan |
| created_at      | TIMESTAMP     |                        |
| updated_at      | TIMESTAMP     |                        |

### stok_mutasi

| Kolom        | Tipe        | Keterangan                              |
|--------------|-------------|------------------------------------------|
| id           | SERIAL (PK) |                                          |
| obat_id      | INT (FK)    |                                          |
| tipe_mutasi  | VARCHAR(20) | masuk / keluar / opname / penyesuaian    |
| jumlah       | INT         |                                          |
| sumber       | VARCHAR(50) | pembelian / penjualan / manual           |
| referensi_id | INT         | id pembelian / penjualan terkait         |
| stok_sebelum | INT         | stok sebelum mutasi                      |
| stok_sesudah | INT         | stok sesudah mutasi                      |
| keterangan   | TEXT        |                                          |
| created_by   | UUID (FK)   | relasi ke users                          |
| created_at   | TIMESTAMP   |                                          |

### supplier

| Kolom         | Tipe          | Keterangan |
|---------------|---------------|------------|
| id            | SERIAL (PK)   |            |
| nama_supplier | VARCHAR(150)  |            |
| telepon       | VARCHAR(20)   |            |
| email         | VARCHAR(150)  |            |
| alamat        | TEXT          |            |
| kontak_person | VARCHAR(100)  |            |
| npwp          | VARCHAR(30)   |            |
| status        | BOOLEAN       |            |
| created_at    | TIMESTAMP     |            |
| updated_at    | TIMESTAMP     |            |

### pelanggan

| Kolom         | Tipe          | Keterangan               |
|---------------|---------------|--------------------------|
| id            | SERIAL (PK)   |                          |
| nama          | VARCHAR(150)  |                          |
| telepon       | VARCHAR(20)   |                          |
| alamat        | TEXT          |                          |
| tanggal_lahir | DATE          |                          |
| jenis_kelamin | VARCHAR(10)   | L / P                    |
| no_bpjs       | VARCHAR(30)   | opsional                 |
| no_ktp        | VARCHAR(20)   | opsional                 |
| alergi        | TEXT          | catatan alergi obat      |
| created_at    | TIMESTAMP     |                          |
| updated_at    | TIMESTAMP     |                          |

### pembelian

| Kolom             | Tipe           | Keterangan                      |
|-------------------|----------------|---------------------------------|
| id                | SERIAL (PK)    |                                 |
| nomor_pembelian   | VARCHAR(50)    | UNIQUE, generate otomatis       |
| supplier_id       | INT (FK)       |                                 |
| tanggal_pembelian | DATE           |                                 |
| subtotal          | DECIMAL(15,2)  |                                 |
| diskon            | DECIMAL(15,2)  | default 0                       |
| pajak             | DECIMAL(15,2)  | default 0                       |
| total             | DECIMAL(15,2)  |                                 |
| status            | VARCHAR(20)    | draft / diterima / dibatalkan   |
| catatan           | TEXT           |                                 |
| created_by        | UUID (FK)      |                                 |
| created_at        | TIMESTAMP      |                                 |
| updated_at        | TIMESTAMP      |                                 |

### pembelian_detail

| Kolom           | Tipe           | Keterangan |
|-----------------|----------------|------------|
| id              | SERIAL (PK)    |            |
| pembelian_id    | INT (FK)       |            |
| obat_id         | INT (FK)       |            |
| batch_number    | VARCHAR(100)   |            |
| tanggal_expired | DATE           |            |
| jumlah          | INT            |            |
| harga_beli      | DECIMAL(15,2)  |            |
| diskon          | DECIMAL(15,2)  | default 0  |
| subtotal        | DECIMAL(15,2)  |            |

### penjualan

| Kolom             | Tipe           | Keterangan                       |
|-------------------|----------------|----------------------------------|
| id                | SERIAL (PK)    |                                  |
| nomor_penjualan   | VARCHAR(50)    | UNIQUE, generate otomatis        |
| pelanggan_id      | INT (FK)       | nullable (pelanggan umum)        |
| resep_id          | INT (FK)       | nullable                         |
| tanggal_penjualan | TIMESTAMP      |                                  |
| subtotal          | DECIMAL(15,2)  |                                  |
| diskon            | DECIMAL(15,2)  | default 0                        |
| pajak             | DECIMAL(15,2)  | default 0                        |
| total             | DECIMAL(15,2)  |                                  |
| metode_pembayaran | VARCHAR(30)    | tunai / transfer / BPJS          |
| bayar             | DECIMAL(15,2)  | jumlah uang dibayarkan           |
| kembalian         | DECIMAL(15,2)  |                                  |
| status            | VARCHAR(20)    | selesai / dibatalkan             |
| catatan           | TEXT           |                                  |
| created_by        | UUID (FK)      |                                  |
| created_at        | TIMESTAMP      |                                  |

### penjualan_detail

| Kolom        | Tipe           | Keterangan                          |
|--------------|----------------|-------------------------------------|
| id           | SERIAL (PK)    |                                     |
| penjualan_id | INT (FK)       |                                     |
| obat_id      | INT (FK)       |                                     |
| jumlah       | INT            |                                     |
| harga_jual   | DECIMAL(15,2)  | snapshot harga saat transaksi       |
| diskon       | DECIMAL(15,2)  | default 0                           |
| subtotal     | DECIMAL(15,2)  |                                     |

### resep

| Kolom          | Tipe        | Keterangan                              |
|----------------|-------------|-----------------------------------------|
| id             | SERIAL (PK) |                                         |
| nomor_resep    | VARCHAR(50) | UNIQUE                                  |
| pelanggan_id   | INT (FK)    |                                         |
| penjualan_id   | INT (FK)    | nullable, diisi setelah diproses        |
| nama_dokter    | VARCHAR(150)|                                         |
| no_sip_dokter  | VARCHAR(50) | nomor SIP dokter                        |
| asal_puskesmas | VARCHAR(150)| opsional                                |
| tanggal_resep  | DATE        |                                         |
| catatan        | TEXT        |                                         |
| status         | VARCHAR(20) | menunggu / diproses / selesai / ditolak |
| created_by     | UUID (FK)   |                                         |
| created_at     | TIMESTAMP   |                                         |
| updated_at     | TIMESTAMP   |                                         |

### resep_detail

| Kolom        | Tipe         | Keterangan                    |
|--------------|--------------|-------------------------------|
| id           | SERIAL (PK)  |                               |
| resep_id     | INT (FK)     |                               |
| obat_id      | INT (FK)     |                               |
| aturan_pakai | VARCHAR(200) | misal: 3x1 sesudah makan      |
| jumlah       | INT          |                               |
| catatan      | TEXT         | opsional                      |

### notifikasi

| Kolom        | Tipe         | Keterangan                           |
|--------------|--------------|--------------------------------------|
| id           | SERIAL (PK)  |                                      |
| tipe         | VARCHAR(50)  | stok_menipis / obat_expired / sistem |
| judul        | VARCHAR(200) |                                      |
| pesan        | TEXT         |                                      |
| referensi_id | INT          | id obat / stok terkait               |
| is_read      | BOOLEAN      | default false                        |
| target_role  | VARCHAR(50)  | role yang menerima notifikasi        |
| created_at   | TIMESTAMP    |                                      |

### settings

| Kolom      | Tipe         | Keterangan                              |
|------------|--------------|-----------------------------------------|
| id         | SERIAL (PK)  |                                         |
| key        | VARCHAR(100) | UNIQUE                                  |
| value      | TEXT         |                                         |
| group      | VARCHAR(50)  | apotek / struk / stok / notifikasi      |
| label      | VARCHAR(150) | label UI                                |

**Contoh key settings:**
- `apotek_nama`, `apotek_alamat`, `apotek_telepon`, `apotek_logo_url`, `apotek_sipa`
- `struk_header`, `struk_footer`, `struk_tampilkan_logo`
- `stok_minimum_default`, `notifikasi_expired_hari`

---

## Rencana API Endpoint (Goravel REST API)

Base URL: `https://api.apotek.com/api/v1`

### Auth

| Method | Endpoint    | Akses  | Keterangan             |
|--------|-------------|--------|------------------------|
| POST   | /auth/login | Publik | Login via Supabase     |
| POST   | /auth/logout| Auth   | Logout & hapus session |
| GET    | /auth/me    | Auth   | Data user yang login   |

### Obat

| Method | Endpoint      | Akses | Keterangan               |
|--------|---------------|-------|--------------------------|
| GET    | /obat         | Auth  | Daftar obat (paginate)   |
| POST   | /obat         | Admin | Tambah obat              |
| GET    | /obat/:id     | Auth  | Detail obat              |
| PUT    | /obat/:id     | Admin | Edit obat                |
| DELETE | /obat/:id     | Admin | Hapus obat (soft delete) |
| GET    | /obat/search  | Auth  | Cari obat (untuk kasir)  |

### Kategori

| Method | Endpoint        | Akses | Keterangan |
|--------|-----------------|-------|------------|
| GET    | /kategori       | Auth  | Daftar     |
| POST   | /kategori       | Admin |            |
| PUT    | /kategori/:id   | Admin |            |
| DELETE | /kategori/:id   | Admin |            |

### Supplier

| Method | Endpoint        | Akses | Keterangan |
|--------|-----------------|-------|------------|
| GET    | /supplier       | Auth  | Daftar     |
| POST   | /supplier       | Admin |            |
| GET    | /supplier/:id   | Auth  |            |
| PUT    | /supplier/:id   | Admin |            |
| DELETE | /supplier/:id   | Admin |            |

### Pelanggan

| Method | Endpoint         | Akses        | Keterangan |
|--------|------------------|--------------|------------|
| GET    | /pelanggan       | Auth         |            |
| POST   | /pelanggan       | Admin, Kasir |            |
| GET    | /pelanggan/:id   | Auth         |            |
| PUT    | /pelanggan/:id   | Admin        |            |

### Stok

| Method | Endpoint             | Akses           | Keterangan             |
|--------|----------------------|-----------------|------------------------|
| GET    | /stok                | Auth            | Daftar stok per obat   |
| POST   | /stok/masuk          | Admin, Apoteker | Stok masuk manual      |
| POST   | /stok/keluar         | Admin, Apoteker | Stok keluar manual     |
| POST   | /stok/opname         | Admin, Apoteker | Stok opname            |
| GET    | /stok/hampir-habis   | Auth            | Obat di bawah minimum  |
| GET    | /stok/expired        | Auth            | Obat mendekati expired |
| GET    | /stok/mutasi         | Auth            | Riwayat mutasi stok    |

### Pembelian

| Method | Endpoint                 | Akses | Keterangan                          |
|--------|--------------------------|-------|-------------------------------------|
| GET    | /pembelian               | Admin | Daftar                              |
| POST   | /pembelian               | Admin | Buat PO baru                        |
| GET    | /pembelian/:id           | Admin | Detail                              |
| PUT    | /pembelian/:id/terima    | Admin | Konfirmasi diterima (stok bertambah)|
| DELETE | /pembelian/:id           | Admin | Batalkan (jika masih draft)         |

### Penjualan

| Method | Endpoint                | Akses        | Keterangan             |
|--------|-------------------------|--------------|------------------------|
| GET    | /penjualan              | Admin, Owner |                        |
| POST   | /penjualan              | Kasir        | Buat transaksi baru    |
| GET    | /penjualan/:id          | Auth         |                        |
| POST   | /penjualan/:id/batal    | Admin        | Batalkan transaksi     |

### Resep

| Method | Endpoint             | Akses           | Keterangan                   |
|--------|----------------------|-----------------|------------------------------|
| GET    | /resep               | Admin, Apoteker |                              |
| POST   | /resep               | Apoteker        | Input resep baru             |
| GET    | /resep/:id           | Auth            |                              |
| PUT    | /resep/:id           | Apoteker        |                              |
| POST   | /resep/:id/proses    | Apoteker        | Konversi resep ke penjualan  |

### Laporan

| Method | Endpoint                 | Akses        | Keterangan                   |
|--------|--------------------------|--------------|------------------------------|
| GET    | /laporan/penjualan       | Admin, Owner | Filter: tanggal, export      |
| GET    | /laporan/pembelian       | Admin, Owner |                              |
| GET    | /laporan/stok            | Admin, Owner |                              |
| GET    | /laporan/laba-rugi       | Owner        |                              |
| GET    | /laporan/dashboard       | Auth         | Ringkasan untuk dashboard    |

### Notifikasi

| Method | Endpoint                    | Akses | Keterangan             |
|--------|-----------------------------|-------|------------------------|
| GET    | /notifikasi                 | Auth  | Daftar notifikasi      |
| PUT    | /notifikasi/:id/baca        | Auth  | Tandai sudah dibaca    |
| PUT    | /notifikasi/baca-semua      | Auth  | Tandai semua dibaca    |

### Users

| Method | Endpoint            | Akses | Keterangan              |
|--------|---------------------|-------|-------------------------|
| GET    | /users              | Owner |                         |
| POST   | /users              | Owner | Undang user baru        |
| PUT    | /users/:id          | Owner |                         |
| PUT    | /users/:id/status   | Owner | Aktifkan/nonaktifkan    |

### Pengaturan

| Method | Endpoint      | Akses        | Keterangan            |
|--------|---------------|--------------|-----------------------|
| GET    | /pengaturan   | Auth         | Ambil semua settings  |
| PUT    | /pengaturan   | Owner, Admin | Simpan settings       |

---

## Alur Utama Sistem

### 1. Login

```
User buka /login
-> Input email + password
-> Supabase Auth verifikasi
-> JWT dikembalikan ke frontend
-> Frontend simpan JWT di cookie httpOnly
-> Redirect ke /dashboard sesuai role
```

### 2. Alur Pembelian (Stok Masuk dari Supplier)

```
Admin buat pembelian baru (/pembelian/tambah)
-> Pilih supplier
-> Tambah item obat (obat, batch, expired, qty, harga beli)
-> Simpan sebagai "draft"
-> Saat barang tiba -> Admin konfirmasi "terima"
-> Backend: stok bertambah di tabel stok
-> Backend: catat di stok_mutasi (tipe: masuk, sumber: pembelian)
-> Notifikasi sukses
```

### 3. Alur Penjualan Kasir (Tanpa Resep)

```
Kasir buka /penjualan/kasir
-> Cari obat (nama/kode)
-> Tambah ke keranjang (qty, harga otomatis terisi)
-> Pilih pelanggan (opsional)
-> Pilih metode pembayaran
-> Input nominal bayar -> kembalian dihitung otomatis
-> Kasir konfirmasi transaksi
-> Backend: stok berkurang di tabel stok
-> Backend: catat di stok_mutasi (tipe: keluar, sumber: penjualan)
-> Struk tampil di layar -> bisa di-print
```

### 4. Alur Penjualan dengan Resep

```
Pelanggan datang bawa resep dokter
-> Apoteker buka /resep/tambah
-> Input data resep (nama dokter, no SIP, obat-obatan, aturan pakai)
-> Simpan resep, status: "menunggu"
-> Apoteker verifikasi stok tersedia
-> Apoteker klik "Proses ke Penjualan"
-> Backend: buat transaksi penjualan otomatis dari data resep
-> resep.penjualan_id terisi
-> resep.status = "selesai"
-> Stok berkurang, struk dicetak
```

### 5. Alur Notifikasi Otomatis

```
Setiap hari (cron job backend):
-> Cek semua obat yang stoknya di bawah stok_minimum
-> Cek semua batch obat yang expired dalam N hari (dari setting)
-> Buat entri di tabel notifikasi jika belum ada / sudah berubah
-> Frontend polling atau Supabase Realtime menampilkan badge notifikasi
```

### 6. Alur Stok Opname

```
Apoteker buka /stok/opname
-> Sistem tampilkan daftar obat + jumlah stok di sistem
-> Apoteker input jumlah fisik aktual
-> Sistem hitung selisih (lebih/kurang)
-> Apoteker konfirmasi
-> Backend: update stok sesuai jumlah fisik
-> Backend: catat di stok_mutasi (tipe: opname, keterangan: selisih)
```

---

## Fitur Prioritas

### Prioritas 1 - Fondasi

- Landing page
- Login (Supabase Auth)
- Dashboard ringkasan
- CRUD Obat (+ upload foto)
- CRUD Kategori
- CRUD Supplier

### Prioritas 2 - Operasional Utama

- Manajemen Stok (masuk, keluar, mutasi)
- Pembelian dari supplier
- Penjualan kasir (POS)
- Cetak struk

### Prioritas 3 - Transaksi Lanjutan

- Manajemen Resep -> ke penjualan
- Manajemen Pelanggan
- Laporan penjualan & pembelian
- Laporan stok

### Prioritas 4 - Manajerial & Pelengkap

- Laporan laba rugi
- Stok opname
- Notifikasi stok menipis & expired
- Manajemen User & Role
- Pengaturan apotek & struk
- Export laporan (PDF / Excel)

---

## Catatan Desain UI

- Tampilan bersih, profesional, mudah dipakai staf apotek non-teknis.
- Warna utama: hijau/teal (#0f766e atau turunannya) untuk kesan kesehatan dan kepercayaan.
- Font: Inter (Google Fonts).
- Dashboard padat informasi tapi tetap mudah dibaca dengan card dan ikon.
- Tombol aksi utama jelas dan besar.
- Tabel mendukung pencarian, filter, sort, dan pagination.
- Halaman kasir dioptimalkan untuk layar lebar (desktop/tablet).
- Tampilan mobile tetap rapi untuk cek stok, dashboard, notifikasi.
- Struk dicetak via browser print dialog (bukan PDF), siap untuk printer thermal 58mm/80mm.
- Skeleton loading untuk semua tabel dan data asinkron.
- Toast notifikasi untuk setiap aksi sukses/gagal.

---

## Catatan Teknis

- Validasi data wajib di frontend (Zod) dan backend (Goravel Validation).
- Password dikelola sepenuhnya oleh Supabase Auth (hashing otomatis).
- Setiap perubahan stok WAJIB tercatat di `stok_mutasi`, tidak boleh update langsung.
- Penjualan & pembelian tidak boleh mengubah stok tanpa histori mutasi.
- Harga obat di `penjualan_detail` adalah snapshot saat transaksi (bukan live dari tabel obat).
- Nomor penjualan dan pembelian di-generate otomatis (contoh: `PJL-20260707-0001`).
- Obat yang `membutuhkan_resep = true` tidak bisa dijual tanpa resep di kasir.
- Laporan laba rugi dihitung dari: total penjualan - HPP (berdasarkan harga beli dari stok_mutasi).
- Semua endpoint API dilindungi JWT Supabase, diverifikasi di middleware Goravel.
- CORS dikonfigurasi hanya mengizinkan domain frontend.
- Rate limiting diterapkan di endpoint auth.
- Supabase RLS (Row Level Security) diaktifkan sebagai lapisan keamanan tambahan.

---

## Rencana Deployment

### Arsitektur Server

```
Internet
  |
Nginx (Reverse Proxy + SSL Termination)
  |-- /     -> Next.js (port 3000, PM2)
  |-- /api  -> Goravel (port 8080, systemd)

Supabase Cloud
  |-- Auth
  |-- PostgreSQL Database
  |-- Storage (gambar obat)
```

### Langkah Deployment

1. Siapkan VPS (Ubuntu 22.04, minimal 2GB RAM)
2. Install: Nginx, Go, Node.js, PM2, Certbot
3. Clone repo dari GitHub
4. Setup .env frontend & backend
5. Build Next.js: `npm run build`
6. Build Goravel: `go build -o apotek-api ./main.go`
7. Jalankan Next.js dengan PM2, Goravel dengan systemd
8. Konfigurasi Nginx sebagai reverse proxy
9. Setup SSL dengan Let's Encrypt (`certbot --nginx`)
10. Setup GitHub Actions untuk auto-deploy saat push ke branch `main`

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=https://api.apotek.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

**Backend (.env):**
```
APP_PORT=8080
DB_HOST=db.xxx.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=xxx
SUPABASE_JWT_SECRET=xxx
CORS_ALLOWED_ORIGINS=https://apotek.com
```

---

## Tahapan Eksekusi

### Tahap 1: Landing Page

- Membuat halaman utama publik
- Desain responsif dengan animasi
- Menjelaskan manfaat dan fitur aplikasi
- Menampilkan modul inti

Status: selesai tahap awal, halaman publik tersedia di `/`.

### Tahap 2: Setup Project & Struktur

- Init Next.js 14 (TypeScript + App Router)
- Init Goravel project
- Setup Supabase project (database, auth, storage)
- Konfigurasi koneksi database
- Buat struktur folder frontend & backend
- Setup shadcn/ui, TanStack Query, Zustand
- Buat layout dashboard (sidebar, navbar, header)
- Buat komponen UI dasar (Button, Table, Input, Modal)

Status: selesai untuk fondasi repo saat ini.

Catatan implementasi 2026-07-07:
- Next.js 14 App Router + TypeScript + Tailwind sudah dibuat.
- Layout dashboard, sidebar, navbar, komponen UI dasar, form, service, store, hooks, constants, types, dan utils sudah tersedia.
- Backend folder sudah dibuat mengikuti struktur controller, middleware, request, model, service, migration, seeder, route, config.
- Go 1.26.4 sudah terpasang di `C:\Users\Acer\sdk\go` dan backend lolos `go test ./...`.
- Migration PostgreSQL Supabase sudah berhasil dijalankan pada 2026-07-07 lewat pooler `aws-1-ap-southeast-2.pooler.supabase.com:6543`.

### Tahap 3: Autentikasi

- Buat halaman login
- Integrasi Supabase Auth
- Implementasi JWT middleware di Goravel
- Buat sistem role guard di frontend (useRoleGuard)
- Proteksi semua halaman dashboard
- Redirect otomatis berdasarkan role

Status: selesai sebagai integrasi awal/mock.

Catatan implementasi 2026-07-07:
- Halaman login tersedia di `/login`.
- Supabase client siap konfigurasi via `.env.local`.
- Auth store, role guard frontend, dan middleware auth/role backend sudah dibuat sebagai scaffold.
- Verifikasi Supabase JWT nyata menunggu `SUPABASE_JWT_SECRET` dan project Supabase.

### Tahap 4: Master Data

- Modul Obat (CRUD + foto + search)
- Modul Kategori (CRUD)
- Modul Supplier (CRUD)
- Modul Pelanggan (CRUD + riwayat transaksi)

Status: selesai sebagai UI CRUD mock.

Catatan implementasi 2026-07-07:
- Modul Obat, Kategori, Supplier, dan Pelanggan memiliki route daftar/tambah/detail/edit sesuai plan.
- Data masih menggunakan mock service sampai API/database aktif.

### Tahap 5: Stok & Pembelian

- Modul Stok (lihat, masuk, keluar, mutasi)
- Halaman obat hampir habis & expired
- Modul Pembelian dari supplier (draft -> terima)
- Stok otomatis bertambah saat pembelian dikonfirmasi

Status: selesai sebagai UI operasional mock + backend scaffold.

Catatan implementasi 2026-07-07:
- Modul Stok, stok masuk, stok keluar, opname, hampir habis, expired, dan Pembelian sudah memiliki halaman.
- Service backend sudah menyiapkan aturan mutasi stok sebagai jalur wajib perubahan stok.

### Tahap 6: Penjualan & Resep

- Halaman kasir POS (keranjang, cari obat, bayar)
- Cetak struk (browser print, thermal-ready)
- Riwayat penjualan
- Modul Resep (input, verifikasi, proses ke penjualan)

Status: selesai sebagai POS/resep MVP mock.

Catatan implementasi 2026-07-07:
- Halaman kasir `/penjualan/kasir` sudah memiliki pencarian obat, keranjang, validasi obat resep, pembayaran, kembalian, dan struk print-ready.
- Modul Resep sudah memiliki daftar, tambah, detail, dan proses ke penjualan sebagai flow awal.

### Tahap 7: Laporan

- Laporan penjualan (filter tanggal, chart, export)
- Laporan pembelian
- Laporan stok
- Laporan laba rugi

Status: selesai sebagai laporan UI mock.

Catatan implementasi 2026-07-07:
- Laporan penjualan, pembelian, stok, dan laba rugi tersedia dengan filter tanggal, tabel, ringkasan, CSV, dan print summary.
- Export Excel/PDF production masih perlu disambungkan ke library/file generator final jika dibutuhkan.

### Tahap 8: Fitur Lanjutan

- Notifikasi sistem (stok menipis, expired)
- Stok opname
- Manajemen User & Role
- Pengaturan profil apotek & struk
- Export laporan PDF & Excel

Status: selesai sebagai UI/scaffold lanjutan.

Catatan implementasi 2026-07-07:
- Notifikasi, stok opname, user & role, pengaturan profil/struk/stok/notifikasi sudah tersedia sebagai halaman.
- Cron job notifikasi, Supabase Realtime, dan persistensi database masih menunggu backend/database aktif.

### Tahap 9: Deployment

- Setup VPS & domain
- Konfigurasi Nginx + SSL
- Deploy frontend (Next.js + PM2)
- Deploy backend (Goravel + systemd)
- Setup GitHub Actions CI/CD
- Testing end-to-end di production

Status: belum dikerjakan.

Catatan implementasi 2026-07-07:
- Deployment membutuhkan VPS/domain/credential production.
- Build frontend lokal sudah berhasil dan backend Go sudah diverifikasi dengan `go test ./...`.
