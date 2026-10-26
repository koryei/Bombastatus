// electron-builder afterSign hook: ad-hoc sign the macOS app.
// Without any signature, Apple Silicon Macs report downloaded apps as "damaged".
// An ad-hoc signature (no Apple Developer account needed) makes the bundle valid;
// users still clear the download quarantine flag once (see README).
const { execFileSync } = require("node:child_process");
const { join } = require("node:path");

exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== "darwin") return;
  const app = join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", app], { stdio: "inherit" });
  execFileSync("codesign", ["--verify", "--deep", "--strict", app], { stdio: "inherit" });
};
