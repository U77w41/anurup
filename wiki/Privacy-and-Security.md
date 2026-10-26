# Privacy and security

## Your files stay on your device

ANURUP is a static website. Every tool runs inside your browser tab using Canvas, [pdf-lib](https://pdf-lib.js.org/), [PDF.js](https://mozilla.github.io/pdf.js/) and [QPDF](https://qpdf.sourceforge.io/) compiled to WebAssembly. There is no server that receives your photos, PDFs or passwords, and there is no account.

## What the page downloads

- The app itself, from GitHub Pages. A copy is kept on your device so it works offline.
- Web fonts from Google Fonts.
- The background-removal model from IMG.LY's CDN, only the first time you use Remove Image Background. Your photo is processed locally after that.

## What is stored in your browser

- **Workspace files** are kept in the browser's IndexedDB so they survive a refresh. Remove them one by one or with **Clear all** in the Workspace panel. Clearing site data in your browser settings removes them too.
- **Theme choice** (light or dark) is kept in localStorage.
- **App files** (about 6 MB) are kept by a service worker so ANURUP opens without internet, plus the background-removal model once you have used that tool. These are copies of the app, not of your files.

Nothing else is saved. PDF passwords are used once to decrypt the file and are not stored.

## On a shared computer

Clear the workspace when you are done, or use a private window, which deletes everything when it closes.

## Unlocking PDFs

Remove PDF Password needs the password that opens the file. It does not guess or crack passwords. Only unlock documents you own or are allowed to use.
