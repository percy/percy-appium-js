# @percy/appium-webdriver
[![Version](https://img.shields.io/npm/v/@percy/appium-app.svg)](https://npmjs.org/package/@percy/appium-app)
![Test](https://github.com/percy/percy-appium-js/workflows/Test/badge.svg)

[Percy](https://percy.io) visual testing [Appium (wd)](https://www.npmjs.com/package/wd) and [WebdriverIO](https://webdriver.io/docs/appium-service/)

## Installation

```sh-session
$ npm install --save-dev @percy/cli @percy/appium-app
```

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

`percyScreenshot(driver, name[, options])`

- `driver` (**required**) - A appium driver instance
- `name` (**required**) - The screenshot name; must be unique to each screenshot
- `options` - [See per-snapshot configuration options](https://docs.percy.io/docs/cli-configuration#per-snapshot-configuration)
