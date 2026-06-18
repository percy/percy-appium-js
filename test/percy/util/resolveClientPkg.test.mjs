import { createRequire } from 'module';
import resolveClientPkg from './../../../percy/util/resolveClientPkg.js';

const nodeRequire = createRequire(import.meta.url);

describe('resolveClientPkg', () => {
  it('returns the package.json when the subpath import works', () => {
    const req = (p) => {
      if (p === 'foo/package.json') return { name: 'foo', version: '1.2.3' };
      throw new Error('not found');
    };
    expect(resolveClientPkg('foo', req)).toEqual({ name: 'foo', version: '1.2.3' });
  });

  it('falls back to walking up from the entry point when the subpath is export-restricted (webdriverio v9 style)', () => {
    // Simulate a client (like webdriverio v9) whose "<name>/package.json"
    // subpath is blocked by "exports", but whose files are still requireable
    // via absolute paths. `wd` is installed and used as the stand-in.
    const req = (p) => {
      if (p === 'wd/package.json') {
        throw new Error('Package subpath ./package.json is not defined by "exports"');
      }
      return nodeRequire(p);
    };
    req.resolve = nodeRequire.resolve;

    const pkg = resolveClientPkg('wd', req);
    expect(pkg).not.toBeNull();
    expect(pkg.name).toEqual('wd');
    expect(typeof pkg.version).toEqual('string');
  });

  it('returns null when the package is not installed', () => {
    const req = (p) => { throw new Error('not found'); };
    req.resolve = () => { throw new Error('not found'); };
    expect(resolveClientPkg('definitely-not-installed-xyz', req)).toBeNull();
  });
});
