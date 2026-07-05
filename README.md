<p align="center">
  <img src="src/assets/banner.png" alt="SeaaveyBot" width="100%" />
</p>

<p align="center">
  <strong>WhatsApp Bot Framework</strong><br>
  Built with <a href="https://github.com/WhiskeySockets/Baileys">Baileys</a> + <a href="https://bun.sh">Bun</a>
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
  <strong>English</strong> | <a href="README-ID.md">Bahasa Indonesia</a>
</p>

---

## Features

- **159 commands** across 13 categories (downloaders, group management, media tools, economy, productivity, and more).
- **30 games** including Tic-Tac-Toe, Hangman, Word Chain, and 17 JSON-based word-guessing games.
- **Economy system** with virtual wallet, bank, daily rewards, shop, and peer-to-peer transfers.
- **Leveling & XP** tracking per command with dynamic rank card generation via Sharp.
- **Middleware pipeline** featuring anti-link, anti-spam, anti-viewonce, AFK, and keyword auto-replies.
- **Database integration** using a persistent SQLite database via `bun:sqlite` in WAL mode.
- **Robust connectivity** with seamless automatic reconnection and dual QR or pairing code authentication.

> [!NOTE]
> For the complete command catalog, database schema, project architecture, and advanced configuration details, please refer to the [Developer & Command Guide (AGENTS.md)](AGENTS.md).

## Requirements

- [Bun](https://bun.sh) v1.0+
- [FFmpeg](https://ffmpeg.org/) (for media conversion)
- [libvips](https://libvips.org/) (required by Sharp)

## Installation

### Automated Script (Linux / Termux)

```bash
curl -fsSL https://raw.githubusercontent.com/seaavey/seaavey-bot/main/install.sh | bash
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/seaavey/seaavey-bot.git
cd seaavey-bot

# Install dependencies and configure environment
cp .env.example .env
bun install

# Start the bot
bun run start
```

## Docker

```bash
docker build -t seaaveybot .
docker run -v ./auth:/app/auth -v ./data.db:/app/data.db seaaveybot
```

## Development

| Command          | Description                                       |
| ---------------- | ------------------------------------------------- |
| `bun run dev`    | Start the bot in development mode with hot-reload |
| `bun run start`  | Start the bot in production mode                  |
| `bun run lint`   | Run ESLint and TypeScript compilation checks      |
| `bun run format` | Format code using Prettier                        |

## Contributing

Contributions are welcome. Please open an issue or submit a pull request for any suggestions or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Star History

<a href="https://www.star-history.com/#seaavey/seaavey-bot&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=seaavey/seaavey-bot&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=seaavey/seaavey-bot&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=seaavey/seaavey-bot&type=Date" />
 </picture>
</a>
