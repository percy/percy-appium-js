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
      const pkgPath = path.join(dir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = req(pkgPath);
        if (pkg && pkg.name === name) return pkg;
      }
      dir = path.dirname(dir);
    }
  } catch { /* not installed */ }

  return null;
}

module.exports = resolveClientPkg;
