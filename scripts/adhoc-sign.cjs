// electron-builder `afterPack` hook: gives the macOS app an ad-hoc signature when
// there is no signing certificate.
//
// Packaging changes the app bundle after Electron's own signature was made, and
// electron-builder signs nothing without a certificate. An Apple silicon Mac then
// refuses a downloaded copy as "damaged". With an ad-hoc signature it is an app from
// an unidentified developer instead, which can be allowed in System Settings.
//
// With a certificate (CSC_LINK or CSC_NAME), electron-builder signs after this hook
// and this does nothing.

const { execFileSync } = require('node:child_process')
const path = require('node:path')

exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== 'darwin') return
  if (process.env.CSC_LINK || process.env.CSC_NAME) return

  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
  try {
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' })
    console.log(`  • ad-hoc signed  ${app}`)
  } catch (e) {
    // Not fatal: the app is then packaged unsigned, as it would be without this hook.
    console.warn(`  • ad-hoc signing failed, the app stays unsigned: ${e.message}`)
  }
}
