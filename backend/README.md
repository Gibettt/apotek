# Backend Apotek

Struktur backend mengikuti rancangan Goravel di `plan.md`: controller, middleware, request validation, model, service, migration, dan seeder.

Go 1.26.4 sudah terpasang di `C:\Users\Acer\sdk\go`. Skeleton ini memakai `net/http` agar kontrak endpoint bisa dibaca dan diuji cepat, lalu handler-nya bisa dipindahkan ke Goravel saat framework Go dipakai penuh.

## Jalankan

```bash
cp .env.example .env
go run ./main.go
```

Base URL lokal: `http://localhost:8080/api/v1`.
