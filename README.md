<p align="center">
  <img src="https://placehold.co/600x300.png" alt="LexiConvert Banner" data-ai-hint="abstract document conversion" />
</p>

# LexiConvert

<p align="center">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-blue.svg">
</p>

<p align="center">
  <strong>A powerful, privacy-first, modern file conversion tool that runs entirely in your browser—no internet connection required.</strong>
  <br />
  LexiConvert is permanently free for both personal and commercial use.
</p>

---

## 🚀 About LexiConvert

LexiConvert is a file conversion application designed for users who prioritize privacy and efficiency. Unlike traditional online conversion tools, LexiConvert leverages the power of your browser to perform all conversion tasks **locally and offline**. Once the application is loaded, you no longer need an internet connection. This means your files never leave your computer, guaranteeing absolute data security and privacy. Whether you need to convert images, documents, audio, or video, LexiConvert provides a seamless, secure, and performant solution.

**Core Features:**
*   **Offline First**: All file conversions happen within your browser's sandbox. After the initial load, no internet connection is needed.
*   **Absolute Privacy**: Your data is never uploaded to any server. It remains 100% private and on your device.
*   **Extensive Format Support**:
    *   **Documents**: Convert DOCX, XLSX, EPUB, and TXT files to PDF. Extract pages from PDFs into images (PNG, JPG, etc.).
    *   **Images**: Convert between common image formats like PNG, JPG, WEBP, BMP, GIF, and even convert images to PDF, SVG (experimental), or ICO.
    *   **Audio/Video**: Perform basic conversions for audio (MP3, WAV) and video (MP4, GIF, MP3 extraction). *(Note: Relies on mock API calls in this version, designed to be replaced with a real backend service).*
*   **Batch Processing**: Easily upload multiple files and convert them to your desired format in one go.
*   **Persistent History**: Your conversion history is automatically saved locally using IndexedDB, allowing you to re-download past files at any time.
*   **Secure Session Locking**: An optional password feature protects your session and history from unauthorized access.
*   **Modern UI**: A beautiful and responsive interface built with Next.js, Tailwind CSS, and shadcn/ui.

---

## 🛠️ Quick Start (Local Deployment)

You can easily deploy and run LexiConvert on your own machine. Follow these steps:

1.  **Clone the Repository**
    First, clone the project to your local machine using `git`.
    ```bash
    git clone https://github.com/your-username/lexiconvert.git
    cd lexiconvert
    ```

2.  **Install Dependencies**
    We use `npm` to manage the project's packages. Run the following command to install all necessary dependencies.
    ```bash
    npm install
    ```

3.  **Run the Development Server**
    Once the installation is complete, you can start the local development server.
    ```bash
    npm run dev
    ```

4.  **Open the Application**
    Now, open your browser and navigate to [http://localhost:9002](http://localhost:9002). You should see LexiConvert up and running!

---

## 🔒 Security Policy

We treat your data security and privacy as our highest priority. Here are the security measures adopted by LexiConvert:

*   **Client-Side Processing**: This is our core security promise. All file reading, processing, and conversion occur entirely within your browser's sandboxed environment. No file data is ever uploaded to any server.

*   **Local Storage**: Your conversion history, including the file data itself, is securely stored on your local machine using the browser's `IndexedDB` technology. This allows you to retain your work even if you close the browser, while ensuring your data never leaves your device.

*   **Optional Session Password Protection**:
    *   On first use, you can choose to set a password to protect your application.
    *   If a password is set, it must be entered each time you open or refresh the page to access your conversion history.

*   **Progressive Brute-Force Protection**:
    *   To prevent password guessing, we've implemented a progressive lockout mechanism.
    *   10 consecutive incorrect password entries will lock the account for 1 minute.
    *   2 more incorrect entries will result in a 1-hour lockout.
    *   If 2 more entries are incorrect, the tool will be permanently disabled until you choose to manually delete all local data (including the password and history) to reset the application.

---

## ❤️ Acknowledgements

LexiConvert would not be possible without the incredible work of the open-source community. We extend our sincerest gratitude to the developers and contributors of these exceptional projects:

*   **Frameworks & Tooling**
    *   [Next.js](https://nextjs.org/) - The React Framework for the Web.
    *   [React](https://react.dev/) - The library for web and native user interfaces.
    *   [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
    *   [Genkit](https://firebase.google.com/docs/genkit) - A new open source framework from Firebase to help you build, deploy, and monitor production-ready AI-powered apps.

*   **UI & Animation**
    *   [shadcn/ui](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS.
    *   [Lucide React](https://lucide.dev/) - Beautiful and consistent icons.
    *   [Framer Motion](https://www.framer.com/motion/) - A powerful production-ready motion library for React.

*   **Core Conversion & File Handling Libraries**
    *   [pdf-lib](https://pdf-lib.js.org/) - Create and modify PDF documents in any JavaScript environment.
    *   [react-pdf](https://github.com/wojtekmaj/react-pdf) - Display PDFs in your React app as easily as if they were images.
    *   [pdfjs-dist](https://github.com/mozilla/pdf.js) - A Portable Document Format (PDF) viewer that is built with HTML5.
    *   [JSZip](https://github.com/Stuk/jszip) - A JavaScript library for creating, reading and editing .zip files.
    *   [idb](https://github.com/jakearchibald/idb) - A tiny (~1.4k) promise-based wrapper for IndexedDB.
    *   [epub.js](https://github.com/futurepress/epub.js) - A JavaScript library for rendering ePub documents in the browser.
    *   [Potrace](https://github.com/tooolit/potrace) - A tool for transforming bitmaps into vector graphics.
    *   [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs) - The world's most popular spreadsheet toolkit.
    *   [wav](https://github.com/TooTallNate/node-wav) - A Node.js WAV file encoder/decoder.

Projects like LexiConvert are built on the shoulders of giants. Thank you to the entire open-source community for your hard work and dedication.
