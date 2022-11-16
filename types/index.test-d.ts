import { expectType, expectError } from 'tsd';
import percyScreenshot from '.';

declare const driver: any;

expectError(percyScreenshot());
expectError(percyScreenshot(driver));
expectError(percyScreenshot('Snapshot name'));

expectType<Promise<Object>>(percyScreenshot(driver, 'Screenshot name'));
expectType<Promise<Object>>(percyScreenshot(driver, 'Screenshot name', { fullscreen: true }));
