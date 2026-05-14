# WallGrab 🎨

### What is WallGrab? 
Imagine you have a magic picture frame on your desk, and you want to put the coolest, prettiest, highest-quality superhero and space pictures in it. But finding these pictures on the internet is like looking for a specific shiny pebble on a giant beach. And sometimes, grumpy trolls (website guards) don't want to let you take the pictures!

**WallGrab** is a super-fast robot friend that does the looking for you. You just point it at a website, and it zooms across the internet, sneaks past the grumpy trolls, grabs the absolute biggest and sparkliest versions of the pictures (4K quality!), and brings them right to your computer. It does all the hard work so you can just enjoy the pretty art!

---

## 🚀 Features

*   **Super Fast Scraping Engine:** Built in Rust using `napi-rs` for non-blocking, lightning-fast web scraping.
*   **Smart Hunting & 404 Fallbacks:** Intelligently infers 4K image URLs directly from listing pages to save bandwidth, with a recursive fallback to detail pages if the guess fails.
*   **Bypasses Bot Detection:** Utilizes customized headers to navigate Cloudflare and hotlink protections effortlessly.
*   **Modern Glassmorphism UI:** A stunning React frontend styled with Tailwind CSS and Framer Motion for smooth, dynamic animations.
*   **Desktop Integrated:** Packaged as a standalone executable via Electron Forge for seamless Windows/macOS/Linux usage.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion, Vite
*   **Backend (Native Module):** Rust, `napi-rs`
*   **Desktop Wrapper:** Electron, Electron Forge

## 📦 Getting Started

### Prerequisites
Make sure you have the following installed:
*   [Node.js](https://nodejs.org/)
*   [Rust & Cargo](https://rustup.rs/) (for compiling the native scraper)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/wallgrab.git
   cd wallgrab
   ```

2. Install the JavaScript dependencies:
   ```bash
   npm install
   ```

3. Build the Rust native module (if you make changes to the Rust code):
   ```bash
   cd native
   npm install
   npm run build
   cd ..
   ```

### Running Locally

To start the app in development mode with hot-reloading:
```bash
npm start
```

### Packaging for Production

To create a standalone, double-clickable executable for your current operating system:
```bash
npm run make
```
The packaged application and installer will be generated and placed in the `out/` directory.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 

## 📝 License
This project is licensed under the MIT License.
