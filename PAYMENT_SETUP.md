# Setup Accurate e-Payment

Alur kasir menggunakan Xendit untuk checkout digital dan Accurate Online untuk
pencatatan Faktur Penjualan setelah pembayaran terverifikasi.

## 1. Terapkan migrasi

Jalankan isi `Migration010AddPaymentGateway` pada database Supabase. Migrasi
menambah metadata pembayaran dan fungsi `finalize_accurate_payment` yang
menyelesaikan penjualan serta mengurangi stok secara atomik.

## 2. Konfigurasi Xendit

1. Buat secret API key Xendit dengan izin Money-In.
2. Salin callback verification token dari dashboard Xendit.
3. Atur Payment Session webhook ke:
   `https://domain-apotek.example/api/webhooks/xendit`.
4. Isi `XENDIT_SECRET_KEY` dan `XENDIT_CALLBACK_TOKEN` di environment server.

Gunakan key test terlebih dahulu. Jangan mengaktifkan live mode sebelum HTTPS,
autentikasi kasir nyata, dan callback production sudah diverifikasi.

## 3. Konfigurasi Accurate Online

1. Buat API Token khusus integrasi dengan akses simpan Faktur Penjualan.
2. Dapatkan host dan session database Accurate yang akan dipakai.
3. Pastikan `kode_obat` lokal sama dengan nomor Barang & Jasa di Accurate.
4. Buat pelanggan umum di Accurate, lalu isi nomornya pada
   `ACCURATE_CUSTOMER_NO`.
5. Isi seluruh variable `ACCURATE_*` dari `.env.example` pada environment server.

Host Accurate dapat berubah. Perbarui `ACCURATE_HOST` dan
`ACCURATE_SESSION_ID` sesuai hasil koneksi API Accurate bila terjadi perubahan.

## 4. Aktifkan secara eksplisit

Lengkapi variable server-only berikut:

```dotenv
PAYMENT_GATEWAY_ENABLED=true
APP_URL=https://domain-apotek.example
SUPABASE_SERVICE_ROLE_KEY=...
XENDIT_SECRET_KEY=...
XENDIT_CALLBACK_TOKEN=...
ACCURATE_API_TOKEN=...
ACCURATE_HOST=...
ACCURATE_SESSION_ID=...
ACCURATE_CUSTOMER_NO=...
```

Nilai tersebut tidak boleh memakai prefix `NEXT_PUBLIC_` dan tidak boleh
dimasukkan ke source control.

## Catatan produksi

Login aplikasi saat ini masih memakai sesi mock. Sebelum memakai Xendit live,
ganti login dengan autentikasi server/Supabase Auth dan wajibkan sesi kasir pada
route pembuatan pembayaran. Same-origin check dan rate limit yang sudah ada
adalah lapisan tambahan, bukan pengganti autentikasi pengguna.
