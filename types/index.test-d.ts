import { expectType, expectError } from 'tsd';
import { WebDriver } from 'selenium-webdriver';
import percySnapshot from '.';

declare const driver: WebDriver;

expectError(percyScreenshot());
expectError(percyScreenshot(driver));
expectError(percyScreenshot('Snapshot name'));

expectType<Promise<void>>(percyScreenshot(driver, 'Snapshot name'));
expectType<Promise<void>>(percyScreenshot(driver, 'Snapshot name', { widths: [1000] }));

expectError(percyScreenshot(driver, 'Snapshot name', { foo: 'bar' }));
