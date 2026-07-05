<p align="center">
  <img src="src/assets/banner.png" alt="SeaaveyBot" width="100%" />
</p>

<p align="center">
  <strong>Framework Bot WhatsApp Open Source</strong><br>
  Dibangun dengan <a href="https://github.com/WhiskeySockets/Baileys">Baileys</a> dan <a href="https://bun.sh">Bun</a>
</p>

<p align="center">
  <a href="https://github.com/seaavey/seaavey-bot/stargazers"><img src="https://img.shields.io/github/stars/seaavey/seaavey-bot?style=flat&color=yellow" alt="Stars" /></a>&nbsp;
  <a href="https://github.com/seaavey/seaavey-bot/network/members"><img src="https://img.shields.io/github/forks/seaavey/seaavey-bot?style=flat&color=blue" alt="Forks" /></a>&nbsp;
  <a href="https://github.com/seaavey/seaavey-bot/issues"><img src="https://img.shields.io/github/issues/seaavey/seaavey-bot?style=flat&color=red" alt="Issues" /></a>&nbsp;
  <a href="https://github.com/seaavey/seaavey-bot/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>&nbsp;
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun" alt="Bun" /></a>
</p>

---

<p align="center">
  <a href="README.md">English</a> | <strong>Bahasa Indonesia</strong>
</p>

---

## Features

- **159 perintah** di 13 kategori (pengunduh, manajemen grup, alat media, ekonomi, produktivitas, dan lainnya).
- **30 game** termasuk Tic-Tac-Toe, Hangman, Word Chain, dan 17 game tebak kata berbasis data JSON.
- **Sistem ekonomi** dengan dompet virtual, bank, reward harian, toko, dan transfer antar pengguna.
- **Leveling & XP** per perintah dengan pembuatan kartu rank dinamis menggunakan Sharp.
- **Middleware pipeline** fitur anti-link, anti-spam, anti-viewonce, AFK, dan balasan otomatis berbasis kata kunci.
- **Integrasi database** menggunakan database SQLite persisten melalui `bun:sqlite` dalam mode WAL.
- **Konektivitas tangguh** dengan pemulihan koneksi otomatis serta autentikasi via kode QR atau kode pairing.

> [!NOTE]
> Untuk katalog perintah lengkap, skema database, arsitektur proyek, dan detail konfigurasi tingkat lanjut, silakan merujuk ke [Panduan Developer & Perintah (AGENTS.md)](AGENTS.md).

## Requirements

- [Bun](https://bun.sh) v1.0+
- [FFmpeg](https://ffmpeg.org/) (untuk konversi media)
- [libvips](https://libvips.org/) (dibutuhkan oleh Sharp)

## Installation

### Automated Script (Linux / Termux)

```bash
curl -fsSL https://raw.githubusercontent.com/seaavey/seaavey-bot/main/install.sh | bash
```

### Manual Installation

```bash
# Klon repositori
git clone https://github.com/seaavey/seaavey-bot.git
cd seaavey-bot

# Instal dependensi dan konfigurasi lingkungan
cp .env.example .env
bun install

# Jalankan bot
bun run start
```

## Docker

```bash
docker build -t seaaveybot .
docker run -v ./auth:/app/auth -v ./data.db:/app/data.db seaaveybot
```

## Development

| Perintah         | Deskripsi                                                 |
| ---------------- | --------------------------------------------------------- |
| `bun run dev`    | Menjalankan bot dalam mode pengembangan dengan hot-reload |
| `bun run start`  | Menjalankan bot dalam mode produksi                       |
| `bun run lint`   | Menjalankan pemeriksaan ESLint dan kompilasi TypeScript   |
| `bun run format` | Memformat kode menggunakan Prettier                       |

## Contributing

Kontribusi sangat terbuka. Silakan buka issue atau kirim pull request untuk saran atau perbaikan.

## License

Proyek ini dilisensikan di bawah Lisensi MIT - lihat file [LICENSE](LICENSE) untuk detailnya.

## Star History

<a href="https://www.star-history.com/#seaavey/seaavey-bot&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=seaavey/seaavey-bot&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=seaavey/seaavey-bot&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=seaavey/seaavey-bot&type=Date" />
 </picture>
</a>
