import webdriver from 'selenium-webdriver';
import helpers from '@percy/sdk-utils/test/helpers';
import percyScreenshot from '../index.js';

describe('percyScreenshot', () => {
  let driver;

  beforeAll(async function() {
    driver = // @todo
  });

  afterAll(async () => {
    // await driver.quit();
  });

  beforeEach(async () => {
    await helpers.setupTest();
  });

  it('has tests', () => {
    throw new Error('new tests');
  });
});
