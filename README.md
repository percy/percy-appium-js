# @percy/appium-app
[![Version](https://img.shields.io/npm/v/@percy/appium-app.svg)](https://npmjs.org/package/@percy/appium-app)
![Test](https://github.com/percy/percy-appium-js/workflows/Test/badge.svg)

[Percy](https://percy.io) visual testing [Appium (wd)](https://www.npmjs.com/package/wd) and [WebdriverIO](https://webdriver.io/docs/appium-service/)

## Installation

```sh-session
$ npm install --save-dev @percy/cli @percy/appium-app
```
> Notes: 
>
> Minimum required version for `@percy/cli` is `1.15.0` for this package to work correctly.
>
> This is tested on node 14+ and should be compatible with all newer node versions

## Usage

This is an example test using the `percyScreenshot` function.

```js
const percyScreenshot = require('@percy/appium-app');

describe('Appium webdriverio test example', function() {
  it('takes a screenshot', async () => {
    await percyScreenshot('Appium JS example');
  });
});

describe('Appium wd test example', function() {
  it('takes a screenshot', async () => {
    driver = // use your existing way to create appium driver with wd
    await percyScreenshot(driver, 'Appium JS example');
  });
});
```

Running the test above normally will result in the following log:

```sh-session
[percy] Percy is not running, disabling screenshots
```

When running with [`percy
app:exec`](https://github.com/percy/cli/tree/master/packages/cli-exec#app-exec), and your project's
`PERCY_TOKEN`, a new Percy build will be created and screenshots will be uploaded to your project.

```sh-session
$ export PERCY_TOKEN=[your-project-token]
$ percy app:exec -- [appium test command]
[percy] Percy has started!
[percy] Created build #1: https://percy.io/[your-project]
[percy] Screenshot taken "Appium JS example"
[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!
```

## Configuration

```js
percyScreenshot(driver, name[, {
  fullscreen,
  deviceName,
  orientation,
  statusBarHeight,
  navigationBarHeight
}])
```

- `driver` (**required**) - A appium driver instance [ can be skipped in case of webdriverio runner]
- `name` (**required**) - The screenshot name; must be unique to each screenshot
- `options object` (**optional**) 
  - `fullscreen`: if the app is currently in fullscreen
  - `deviceName`: custom device name to override SDK fetched name
  - `orientation`: "portrait"/"landscape" tell SDK which orientation app is in [ Note: This is only for tagging purpose, does not change the orientation of the device ]
  - `statusBarHeight`: In px if you want to override SDK
  - `navigationBarHeight`: In px if you want to override SDK
  - `fullPage`: true/false. [Experimental] only supported on App Automate driver sessions [ needs @percy/cli 1.20.2+ ]
  - `screenLengths`: int [Experimental] max screen lengths for fullPage [ needs @percy/cli 1.20.2+ ]
  - `scrollableXpath` (**optional**) - [Experimental] scrollable element xpath for fullpage [ needs @percy/cli 1.20.2+ ]; string
  - `scrollableId` (**optional**) - [Experimental] scrollable element accessibility id for fullpage [ needs @percy/cli 1.20.2+ ]; string
  - `ignoreRegionXpaths` (**optional**) - elements xpaths that user want to ignore in visual diff [ needs @percy/cli 1.23.0+ ]; list of string
  - `ignoreRegionAccessibilityIds` (**optional**) - elements accessibility_ids that user want to ignore in visual diff [ needs @percy/cli 1.23.0+ ]; list of string
  - `ignoreRegionAppiumElements` (**optional**) - appium elements that user want to ignore in visual diff [ needs @percy/cli 1.23.0+ ]; list of appium element object
  - `customIgnoreRegions` (**optional**) - custom locations that user want to ignore in visual diff [ needs @percy/cli 1.23.0+ ]; list of ignore_region object
  - IgnoreRegion:-
    - Description: This class represents a rectangular area on a screen that needs to be ignored for visual diff.

    - Constructor:
      ```
      constructor(top, bottom, left, right)
      ```

    - Parameters:

      `top` (int): Top coordinate of the ignore region.

      `bottom` (int): Bottom coordinate of the ignore region.

      `left` (int): Left coordinate of the ignore region.

      `right` (int): Right coordinate of the ignore region.
    - Raises:Error: If top, bottom, left, or right is less than 0 or top is greater than or equal to bottom or left is greater than or equal to right.
    - valid: Ignore region should be within the boundaries of the screen.
