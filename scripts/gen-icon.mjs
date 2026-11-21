// Renders the app icon (build/icon.png, 1024 px) from the canonical logo
// (src/renderer/src/assets/mkfont-logo.svg). electron-builder derives the
// .ico / .icns from that PNG. Runs inside Electron, which is the SVG renderer
// the project already ships with: `npm run gen:icon`.
import { app, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SIZE = 1024
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'src/renderer/src/assets/mkfont-logo.svg')
const target = resolve(root, 'build/icon.png')

app.disableHardwareAcceleration()

app.whenReady().then(async () => {
  const svg = readFileSync(source, 'utf-8')
  const page = `<!doctype html><style>html,body{margin:0;background:transparent;overflow:hidden}img{display:block;width:${SIZE}px;height:${SIZE}px}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`

  // Offscreen rendering is not tied to a display, so the capture is exactly
  // SIZE x SIZE whatever the screen's scale factor.
  const win = new BrowserWindow({
    width: SIZE,
    height: SIZE,
    show: false,
    frame: false,
    transparent: true,
    useContentSize: true,
    webPreferences: { offscreen: true }
  })
  await win.loadURL(`data:text/html;base64,${Buffer.from(page).toString('base64')}`)
  await win.webContents.executeJavaScript('document.querySelector("img").decode()')

  const image = await win.webContents.capturePage()
  const { width, height } = image.getSize()
  if (width !== SIZE || height !== SIZE) throw new Error(`Expected a ${SIZE} px capture, got ${width} x ${height}`)

  writeFileSync(target, image.toPNG())
  console.log(`Wrote ${target} (${width} x ${height})`)
  app.quit()
}).catch((error) => {
  console.error(error)
  app.exit(1)
})
