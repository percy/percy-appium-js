import percyOnAutomate from '../../percy/percyOnAutomate.js';

const { getElementIdFromElements } = percyOnAutomate;

describe('getElementIdFromElements', () => {
  const a = { elementId: 'a', value: 'wd-a' };
  const b = { elementId: 'b', value: 'wd-b' };

  it('maps an array of wdio elements', async () => {
    expect(await getElementIdFromElements('wdio', [a, b])).toEqual(['a', 'b']);
  });

  it('maps an array of wd elements', async () => {
    expect(await getElementIdFromElements('wd', [a, b])).toEqual(['wd-a', 'wd-b']);
  });

  it('resolves an un-awaited list (e.g. $$() not awaited)', async () => {
    expect(await getElementIdFromElements('wdio', Promise.resolve([a, b]))).toEqual(['a', 'b']);
  });

  it('resolves a list of un-awaited elements (e.g. [$(x), $(y)])', async () => {
    expect(await getElementIdFromElements('wdio', [Promise.resolve(a), b])).toEqual(['a', 'b']);
  });

  it('accepts a single element instead of silently dropping it', async () => {
    expect(await getElementIdFromElements('wdio', a)).toEqual(['a']);
  });

  it('returns an empty list for null/undefined', async () => {
    expect(await getElementIdFromElements('wdio', undefined)).toEqual([]);
    expect(await getElementIdFromElements('wdio', null)).toEqual([]);
  });
});
