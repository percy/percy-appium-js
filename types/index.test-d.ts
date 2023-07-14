import { expectType, expectError } from 'tsd';
import percyScreenshot from '.';

declare const driver: any;
declare const boolVariable: boolean;

expectError(percyScreenshot());
expectError(percyScreenshot(boolVariable));

// This does not throw since driver is of type any
expectType<Promise<Object>>(percyScreenshot(driver));
expectType<Promise<Object>>(percyScreenshot('Snapshot name'));

expectType<Promise<Object>>(percyScreenshot(driver, 'Screenshot name'));
expectType<Promise<Object>>(percyScreenshot(driver, 'Screenshot name', { fullscreen: true }));
