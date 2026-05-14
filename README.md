# WallGrab

![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

> A high-performance desktop application for discovering and downloading 4K wallpapers, built with a Rust-powered native scraping engine and a modern React frontend.

---

## 📸 Screenshots

<!-- Add screenshots here once you have them. See README guide for how. -->
*Screenshots coming soon.*

---

## ✨ Features

- **Native Scraping Engine** — Core scraper written in Rust via `napi-rs`, delivering non-blocking, high-throughput performance
- **Intelligent 4K Resolution Detection** — Directly infers high-resolution (3840×2160) URLs from listing pages, avoiding unnecessary network requests
- **Automatic Fallback Parsing** — If a guessed URL returns a 404, the engine automatically fetches the detail page and retries with the correct resolution
- **Bot Detection Bypass** — Spoofs browser headers (User-Agent, Referer, Accept) to navigate Cloudflare and hotlink protection on target sites
- **Multi-Site Support** — Scraping strategies for `4kwallpapers.com` and `wall.alphacoders.com`, with site-specific logic for each
- **Modern UI** — Glassmorphism-styled interface built with Tailwind CSS and Framer Motion animations
- **Cross-Platform Desktop App** — Packaged as a standalone executable via Electron Forge for Windows, macOS, and Linux

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS, Framer Motion, Vite |
| Native Backend | Rust, napi-rs |
| Desktop Wrapper | Electron, Electron Forge |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Rust & Cargo](https://rustup.rs/) — required to compile the native scraping module

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KrishnaBharadwaj67/wallgrab.git
   cd wallgrab
   ```

2. **Install JavaScript dependencies:**
   ```bash
   npm install
   ```

3. **Build the Rust native module:**
   ```bash
   cd native
   npm install
   npm run build
   cd ..
   ```

### Running in Development

```bash
npm start
```

This starts the app with hot-reloading enabled.

### Building for Production

```bash
npm run make
```

The packaged installer will be output to the `out/` directory.

---

## 🏗️ Architecture

WallGrab uses a two-process architecture:

- **Renderer Process (React + Vite):** Handles the UI, search input, and wallpaper grid display
- **Main Process (Electron + Rust via napi-rs):** Executes the native scraping and downloading logic

The Rust module is compiled to a `.node` binary and loaded directly into the Electron main process via `napi-rs`, bypassing the overhead of a separate HTTP server or subprocess.

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).
