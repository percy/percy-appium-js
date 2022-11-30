// Covering only not covered in index tests
import { GenericProvider } from '../../../percy/providers/genericProvider.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';

describe('GenericProvider', () => {
  let driver;
  let provider;

  beforeEach(async () => {
    driver = AppiumDriverMock();
    provider = new GenericProvider(driver);
  });

  describe('tempFile', () => {
    describe('with PERCY_TMP_DIR', () => {
      beforeAll(() => {
        if (['linux', 'darwin'].includes(process.platform)) {
          process.env.PERCY_TMP_DIR = '/tmp/percy-app-test';
        } else if (process.platform === 'win32') {
          process.env.PERCY_TMP_DIR = 'C:\\percy-app-test';
        }
      });

      afterAll(() => {
        delete process.env.PERCY_TMP_DIR;
      });

      it('creates tmp file in the specified directory', async () => {
        const path = await provider.tempFile();
        expect(path.startsWith(process.env.PERCY_TMP_DIR));
      });
    });
  });
});
