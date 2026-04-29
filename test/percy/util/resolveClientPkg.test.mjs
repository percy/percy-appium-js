import { resolveClientPkg } from '../../../percy/util/resolveClientPkg.js';
import path from 'path';
import fs from 'fs';

describe('resolveClientPkg', () => {
  it('returns package.json when direct require succeeds', () => {
    const mockPkg = { name: 'test-pkg', version: '1.0.0' };
    const req = jasmine.createSpy('req').and.returnValue(mockPkg);
    req.resolve = jasmine.createSpy('resolve');

    const result = resolveClientPkg('test-pkg', req);
    expect(result).toEqual(mockPkg);
    expect(req).toHaveBeenCalledWith('test-pkg/package.json');
    expect(req.resolve).not.toHaveBeenCalled();
  });

  it('walks up directory tree when direct require fails', () => {
    const mockPkg = { name: 'test-pkg', version: '2.0.0' };
    const entryDir = path.join('/fake', 'node_modules', 'test-pkg', 'dist');
    const pkgDir = path.join('/fake', 'node_modules', 'test-pkg');
    const pkgPath = path.join(pkgDir, 'package.json');

    const req = jasmine.createSpy('req').and.throwError('MODULE_NOT_FOUND');
    req.resolve = jasmine.createSpy('resolve').and.returnValue(path.join(entryDir, 'index.js'));

    spyOn(fs, 'existsSync').and.callFake((p) => p === pkgPath);
    spyOn(fs, 'readFileSync').and.callFake((p) => {
      if (p === pkgPath) return JSON.stringify(mockPkg);
      throw new Error('unexpected read');
    });

    const result = resolveClientPkg('test-pkg', req);
    expect(result).toEqual(mockPkg);
    expect(req.resolve).toHaveBeenCalledWith('test-pkg');
  });

  it('skips package.json if name does not match', () => {
    const wrongPkg = { name: 'wrong-pkg', version: '1.0.0' };
    const entryDir = path.join('/fake', 'node_modules', 'test-pkg', 'dist');
    const pkgPath = path.join('/fake', 'node_modules', 'test-pkg', 'package.json');
    const parentPkgPath = path.join('/fake', 'node_modules', 'package.json');

    const req = jasmine.createSpy('req').and.throwError('MODULE_NOT_FOUND');
    req.resolve = jasmine.createSpy('resolve').and.returnValue(path.join(entryDir, 'index.js'));

    spyOn(fs, 'existsSync').and.callFake((p) => p === pkgPath || p === parentPkgPath);
    spyOn(fs, 'readFileSync').and.callFake(() => JSON.stringify(wrongPkg));

    const result = resolveClientPkg('test-pkg', req);
    expect(result).toBeNull();
  });

  it('returns null when resolve also fails', () => {
    const req = jasmine.createSpy('req').and.throwError('MODULE_NOT_FOUND');
    req.resolve = jasmine.createSpy('resolve').and.throwError('MODULE_NOT_FOUND');

    const result = resolveClientPkg('nonexistent', req);
    expect(result).toBeNull();
  });

  it('returns null when no package.json found walking up', () => {
    const entryDir = path.join('/fake', 'deep', 'path');

    const req = jasmine.createSpy('req').and.throwError('MODULE_NOT_FOUND');
    req.resolve = jasmine.createSpy('resolve').and.returnValue(path.join(entryDir, 'index.js'));

    spyOn(fs, 'existsSync').and.returnValue(false);

    const result = resolveClientPkg('test-pkg', req);
    expect(result).toBeNull();
  });
});
