# IC5 Labs website

Static website for [ic5labs.com](https://ic5labs.com): marketing pages, blog, customer account mockups, support case screens, and versioned product documentation.

## Structure

- `index.html` and top-level `*.html`: one file per page
- `styles.css`: shared styles for every page
- `assets/`: logo, images, and documentation screenshots (`assets/docs/`)
- Docs pages follow `docs-<product>-<version>-<page>.html`, standing in for `/docs/<product>/<version>/<page>`

No build step. Fonts load from the jsDelivr CDN (Google Sans Flex and Google Sans Code via Fontsource).

## Hosting

Serve the repository root as a static site. `index.html` is the home page.

## Status

Design mockups: forms, sign-in, and account data are static. Pages are laid out for desktop width.
