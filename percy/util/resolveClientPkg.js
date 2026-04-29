const path = require('path');
const fsSync = require('fs');

function resolveClientPkg(name, req) {
  try { return req(`${name}/package.json`); } catch { }
  // webdriverio v9+ blocks package.json via exports — resolve entry and walk up
  try {
    let dir = path.dirname(req.resolve(name));
    while (dir !== path.parse(dir).root) {
      // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
      const pkgPath = path.join(dir, 'package.json');
      if (fsSync.existsSync(pkgPath)) {
        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
        const pkg = JSON.parse(fsSync.readFileSync(pkgPath, 'utf8'));
        if (pkg.name === name) return pkg;
      }
      dir = path.dirname(dir);
    }
  } catch { }
  return null;
}

module.exports = { resolveClientPkg };
