const fs = require('fs');
const path = require('path');

// Resolves a client package's package.json (name + version) across all major
// versions of the client.
//
// webdriverio v9 stopped exposing "webdriverio/package.json" through its
// "exports" map, so `require('webdriverio/package.json')` throws there. We fall
// back to resolving the package entry point and walking up to the nearest
// package.json — an absolute path require is not subject to the "exports"
// subpath restriction, so this works on v7, v8 and v9 (and on `wd`).
function resolveClientPkg(name, req = require) {
  try {
    return req(`${name}/package.json`);
  } catch { /* exports-restricted (e.g. webdriverio v9) — fall through */ }

  try {
    let dir = path.dirname(req.resolve(name));
    while (dir && dir !== path.dirname(dir)) {
      // `dir` derives from require.resolve(name), not user input — no traversal risk.
      const pkgPath = path.join(dir, 'package.json'); // nosemgrep
      if (fs.existsSync(pkgPath)) {
        const pkg = req(pkgPath);
        /* istanbul ignore next */ // defensive name guard on the v9 walk-up
        if (pkg && pkg.name === name) return pkg;
      }
      dir = path.dirname(dir);
    }
  } catch { /* not installed */ }

  return null;
}

// Resolves the Appium client package (name + version), preferring webdriverio
// over wd when both are present. Centralizes the precedence so callers don't
// repeat it.
function resolveAppiumClientPkg(req = require) {
  return resolveClientPkg('webdriverio', req) || resolveClientPkg('wd', req);
}

module.exports = resolveClientPkg;
module.exports.resolveAppiumClientPkg = resolveAppiumClientPkg;
