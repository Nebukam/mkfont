# MkFont ![version](https://img.shields.io/badge/dynamic/json?color=3ec188&label=version&query=version&url=https://github.com/Nebukam/mkfont/raw/main/package.json) ![license](https://img.shields.io/badge/license-MIT-black.svg)

MkFont is a free (libre) app that builds fonts from shapes drawn elsewhere: SVG files in, a font file out.
Glyphs are fitted between the font's metrics by settings that can change at any time, built from each other with reusable components, and joined by ligatures and kerning pairs. MkFont exports TrueType and OpenType fonts and their web versions (WOFF, WOFF2).

**[Download](https://github.com/Nebukam/mkfont/releases/latest)** · **[Documentation](https://mkfont.gitbook.io/)** · **[Quick start](https://mkfont.gitbook.io/mkfont-docs/quick-start)**

<img width="2304" height="1440" alt="image" src="https://github.com/user-attachments/assets/4f77af9e-b8ec-4714-9c0d-1f082718fe56" />


## Install

Installers for Windows, macOS (Apple silicon and Intel) and Linux are attached to each [release](https://github.com/Nebukam/mkfont/releases).
MkFont needs a 64-bit Windows, or macOS 13 (Ventura) or later.

They are not code-signed, so the system asks before the first launch:

- **Windows**: SmartScreen shows "Windows protected your PC". Choose **More info**, then **Run anyway**.
- **macOS**: open the app once, then allow it under **System Settings › Privacy & Security › Open Anyway**.
- **Linux**: make the AppImage executable (`chmod +x MkFont-*.AppImage`), then run it.

## MkFont 2

MkFont 2 is a rewrite of MkFont on Electron, React and TypeScript. It opens and saves the same `.mkfont` files, and adds:

- **Kerning pairs**, with lists of common pairs to work through and pairs detected from the outlines. They are saved under a key MkFont 1 ignores: MkFont 1 still opens the file, and drops the pairs if it saves it.
- **An outline editor** to adjust the points of an imported shape in place. It edits what is there; drawing from scratch stays with your vector editor.
- **OTF, WOFF and WOFF2 export**, and several formats at once.
- A command palette, context menus, keyboard navigation, light and dark themes, and an interface in English, French, Spanish and Simplified Chinese.

[Coming from MkFont 1](https://mkfont.gitbook.io/mkfont-docs/coming-from-mkfont-1) lists what moved and what changed.

MkFont 1 is kept on the [`archive/v1`](https://github.com/Nebukam/mkfont/tree/archive/v1) branch, and its installers stay on the releases page.

## Building from source

MkFont needs [Node.js](https://nodejs.org/) 24 or later.

```bash
npm install
npm run dev
```

`npm run dev` starts the Electron app with hot reload. `npm run dev:web` serves the editor in a plain browser at http://localhost:5199 (file dialogs fall back to file inputs and downloads).

| Script | What it does |
|---|---|
| `npm run dev` | Electron app in development mode |
| `npm run dev:web` | Browser-only build of the editor |
| `npm test` | Unit tests (transform engine, file format, import/export, history, translations) |
| `npm run typecheck` | TypeScript checks for the renderer and the Electron processes |
| `npm run check:i18n` | Looks for interface text written outside the translation catalogs |
| `npm run build` | Production bundles in `out/` |
| `npm run build:unpack` | Unpacked app in `dist/` (quick packaging check) |
| `npm run build:win` | Windows installer in `dist/` |
| `npm run gen:unicode -- <ucd-dir>` | Regenerates the Unicode data from a UCD download (`UnicodeData.txt`, `Blocks.txt`) |
| `npm run gen:kerning-pairs -- <file>` | Regenerates the common kerning pairs from `result/relevant_kerning_raw.json` of [andre-fuchs/kerning-pairs](https://github.com/andre-fuchs/kerning-pairs) |
| `npm run gen:icon` | Renders `build/icon.png` from `src/renderer/src/assets/mkfont-logo.svg` |

### Project layout

```
src/main/                 Electron main process (dialogs, file watching, window state)
src/preload/              IPC bridge exposed as window.api
src/renderer/src/
  core/                   Framework-free logic: transform engine, composition, file format,
                          SVG/font import, font export, Unicode data
  stores/                 Zustand stores: document + undo history, selection, UI, preferences
  app/                    Commands, shortcuts, clipboard, import flows, document lifecycle
  components/             React UI (shell, grid, inspector, side panels, dialogs, primitives)
  platform/               Electron / browser abstraction for files and clipboard
  locales/                Interface text, one folder per language
src/renderer/public/      Files shipped as they are: the sample font
build/icon.png            App icon (1024 px); electron-builder derives .ico / .icns from it
docs/                     Notes for contributors
```

### Notes for development

- Every edit goes through `transact(label, recipe)` in `stores/doc-store.ts`; it records an undo step and recomputes only the glyphs affected.
- The transform engine (`core/transform.ts`, `core/compute.ts`) is a faithful port of MkFont 1. It was checked against the layer placements MkFont 1 saved in a font when it was ported; `core/__tests__/engine.test.ts` now guards it against the placements saved in the sample font.
- The sample font the app offers is `src/renderer/public/MkFontExample.mkfont`: replace that file to update it. The tests run on it too, and a few rely on what it contains (`À` built from `A` and a grave accent, the usual Latin letters, no ligatures).
- Everything in `src/renderer/public/` ships with the app. Personal test fonts go in `local/`, which Git ignores.
- In development builds, `window.__mkf` exposes the stores and actions for scripted UI checks, and `?mock-electron` replaces the Electron API with an in-memory mock to exercise desktop-only flows in a browser.
- The `electron` and `electron-prod` entries in `.claude/launch.json` start the real app (dev server or built bundles) with Chrome remote debugging on ports 9333 / 9334, so the running window can be driven through the DevTools protocol.
- Every library the app uses is listed in `devDependencies`: Vite bundles them into the renderer, and the main and preload processes only need Electron and Node. Nothing from `node_modules` ends up in the packaged app.
- The package is named `mkfont2` on purpose. Electron names the app's settings folder after it (`%APPDATA%\mkfont2` on Windows), and `mkfont` is the folder MkFont 1 uses: renamed, MkFont 2 would start in MkFont 1's profile and lose its own.
- macOS builds have no signing certificate. `scripts/adhoc-sign.cjs` gives the app an ad-hoc signature while it is packaged, so that a downloaded copy can be allowed in System Settings.
- Releases are built by `.github/workflows/release.yml`: set the version in `package.json`, push a tag with the same number (`v2.0.0`), then publish the draft release the run creates. **Run workflow** on the Actions page builds the installers without a release.
- The outline editor (`components/outline-editor`) edits a glyph's imported path (`pathData.path`) through the fit matrix compute exposes (`VariantComputed.ownMatrix`): points are shown in font units and stored back in the path's own space, one `transact` per gesture. Its engine (`engine/`) is the only code that uses Paper.js; it has no React and runs in the Node tests.
- Production builds get a Content Security Policy (`electron.vite.config.ts`); the dev server runs without one because React refresh needs inline scripts.
- Packaging on Windows needs symlink rights (Developer Mode or an elevated shell): electron-builder unpacks its `winCodeSign` tools, which contain symlinks, before it writes the executable's metadata.

## Translations

The interface is translated through catalogs, one folder per language, and a new language is welcome.
[Adding a language](https://mkfont.gitbook.io/mkfont-docs/adding-a-language) walks through it, from copying the English files to the checks a translation has to pass. The conventions for interface text in the code are in [`docs/i18n.md`](docs/i18n.md).

## Kudos

MkFont wouldn't be possible if not for the [@fontello](https://github.com/fontello) folks sharing their magic: font export is built around [svg2ttf](https://github.com/fontello/svg2ttf) and [svgpath](https://github.com/fontello/svgpath).
It also stands on [opentype.js](https://github.com/opentypejs/opentype.js), [Paper.js](http://paperjs.org/), [SVGO](https://github.com/svg/svgo), the [Unicode](https://home.unicode.org/) database, and André Fuchs' [kerning-pairs](https://github.com/andre-fuchs/kerning-pairs) (MIT, see `src/renderer/src/data/kerning-pairs.LICENSE.md`).

## License

[MIT](LICENSE).

## A note on how MkFont 2 was made

MkFont 2 was built with the help of [Claude Code](https://claude.com/claude-code).

**MkFont 1 was written by hand, on a framework of my own. It had reached the point where everything I still wanted for it (kerning, an outline editor, a codebase other people could contribute to) meant a rewrite I was never going to find the time for. Working with Claude is what made that rewrite possible.**

It was not generated and shipped. The design and the decisions are mine, and so is the stubbornness about details: every feature was specified, tried on real fonts, and sent back until it behaved, with tests that hold the engine to what MkFont 1 computed. What came out is the MkFont I had wanted to make for a long time, and a better one than I could have made alone. It's a more robust and more maintainable tool that it could ever have been, and it will continue to improve.

I know this is a charged subject, and I understand the people who are uneasy about it. I only hope MkFont 2 gets judged on what it is, and that the care and the work that went into it still shows.
