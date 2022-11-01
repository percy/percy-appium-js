import { SnapshotOptions } from '@percy/core';
import { WebDriver } from 'selenium-webdriver';

export default function percyScreenshot(
  browser: WebDriver,
  name: string,
  options?: SnapshotOptions
): Promise<void>;
