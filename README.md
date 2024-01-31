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
> Minimum required version for `@percy/cli` is `1.25.0` for this package to work correctly.
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
  - `sync` - Boolean value by default it falls back to false, Gives the processed result around screenshot [From CLI v1.28.0-beta.0+]
  - `fullscreen`: If the app is currently in fullscreen; boolean
  - `deviceName`: Custom device name to override SDK fetched name
  - `orientation`: ["portrait"/"landscape"] - Tell SDK which orientation app is in [ Note: This is only for tagging purpose, does not change the orientation of the device ]
  - `statusBarHeight`: In px if you want to override SDK; int
  - `navigationBarHeight`: In px if you want to override SDK; int
  - `fullPage`: [Alpha] Only supported on App Automate driver sessions [ needs @percy/cli 1.20.2+ ]; boolean
    - `screenLengths`: [Alpha] Max screen lengths for fullPage; int
    - In case scrollview is overlapping with other app elements. Offsets can be provided to reduce the area which needs to be considered for scrolling:
      - `topScrollviewOffset`: [Alpha] Offset from top of scrollview; int
      - `bottomScrollviewOffset`: [Alpha] Offset from bottom of scrollview; int
  - `scrollableXpath` [Alpha] Scrollable element xpath for fullpage; string
  - `scrollableId`: [Alpha] Scrollable element accessibility id for fullpage; string
  - `ignoreRegionXpaths`: Elements xpaths that user want to ignore in visual diff; list of string
  - `ignoreRegionAccessibilityIds`: Elements accessibility_ids that user want to ignore in visual diff; list of string
  - `ignoreRegionAppiumElements`: Appium elements that user want to ignore in visual diff; list of appium element object
  - `customIgnoreRegions`: Custom locations that user want to ignore in visual diff; list of ignore_region object
  - IgnoreRegion:-
    - Description: This class represents a rectangular area on a screen that needs to be ignored for visual diff.
    - Constructor:
      ```
      constructor(top, bottom, left, right)
      ```
    - Parameters:
      - `top` (int): Top coordinate of the ignore region.
      - `bottom` (int): Bottom coordinate of the ignore region.
      - `left` (int): Left coordinate of the ignore region.
      - `right` (int): Right coordinate of the ignore region.
## Running with Hybrid Apps

For a hybrid app, we need to switch to native context before taking screenshot.

- Add a helper method similar to following for say flutter based hybrid app:
```js
async function percyScreenshotFlutter(driver, name, options) {
  // switch to native context
  await driver.switchContext('NATIVE_APP');
  await percyScreenshot(driver, name, options);
  // switch back to flutter context
  await driver.switchContext('FLUTTER');
}
```

- Call percyScreenshotFlutter helper function when you want to take screenshot.
```js
await percyScreenshotFlutter(driver, name[, {
  fullscreen,
  deviceName,
  orientation,
  statusBarHeight,
  navigationBarHeight
}])
```

> Note: 
>
> For other hybrid apps the `await driver.switchContext('FLUTTER');` would change to context that it uses like say WEBVIEW etc.
>

## Running Percy on Automate
`percyScreenshot(driver, name, options)` [ needs @percy/cli 1.27.0-beta.0+ ];
- `driver` (**required**) - A appium driver instance
- `name` (**required**) - The screenshot name; must be unique to each screenshot
- `options` (**optional**) - There are various options supported by percy_screenshot to server further functionality.
    - `freezeAnimatedImage` - Boolean value by default it falls back to `false`, you can pass `true` and percy will freeze image based animations.
    - `freezeImageBySelectors` - List of selectors. Images will be freezed which are passed using selectors. For this to work `freezeAnimatedImage` must be set to true.
    - `freezeImageByXpaths` - List of xpaths. Images will be freezed which are passed using xpaths. For this to work `freezeAnimatedImage` must be set to true.
    - `percyCSS` - Custom CSS to be added to DOM before the screenshot being taken. Note: This gets removed once the screenshot is taken.
    - `ignoreRegionXpaths` - List of xpaths. elements in the DOM can be ignored using xpath
    - `ignoreRegionSelectors` - List of selectors. elements in the DOM can be ignored using selectors.
    - `ignoreRegionAppiumElements` - List of appium web-element. elements can be ignored using appiumElements.
    - `customIgnoreRegions` - List of custom objects. elements can be ignored using custom boundaries. Just passing a simple object for it like below.
      - example: ```{top: 10, right: 10, bottom: 120, left: 10}```
      - In above example it will draw rectangle of ignore region as per given coordinates.
        - `top` (int): Top coordinate of the ignore region.
        - `bottom` (int): Bottom coordinate of the ignore region.
        - `left` (int): Left coordinate of the ignore region.
        - `right` (int): Right coordinate of the ignore region.
    - `considerRegionXpaths` - List of xpaths. elements in the DOM can be considered for diffing and will be ignored by Intelli Ignore using xpaths.
    - `considerRegionSelectors` - List of selectors. elements in the DOM can be considered for diffing and will be ignored by Intelli Ignore using selectors.
    - `considerRegionAppiumElements` - List of appium web-element. elements can be considered for diffing and will be ignored by Intelli Ignore using appium_elements.
    - `customConsiderRegions` - List of custom objects. elements can be considered for diffing and will be ignored by Intelli Ignore using custom boundaries
      - example:  ```{top: 10, right: 10, bottom: 120, left: 10}```
      - In above example it will draw rectangle of consider region will be drawn.
      - Parameters:
        - `top` (int): Top coordinate of the consider region.
        - `bottom` (int): Bottom coordinate of the consider region.
        - `left` (int): Left coordinate of the consider region.
        - `right` (int): Right coordinate of the consider region.
### Creating Percy on automate build
Note: Automate Percy Token starts with `auto` keyword. The command can be triggered using `exec` keyword.
```sh-session
$ export PERCY_TOKEN=[your-project-token]
$ percy exec -- [python test command]
[percy] Percy has started!
[percy] [Python example] : Starting automate screenshot ...
[percy] Screenshot taken "Python example"
[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!
```

Refer to docs here: [Percy on Automate](https://docs.percy.io/docs/integrate-functional-testing-with-visual-testing)
