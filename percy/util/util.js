const log = require('./log');

function extractStatusBarHeight(input) {
  try {
    const pattern = /ITYPE_STATUS_BAR frame=\[\d+,\d+\]\[\d+,(\d+)\]/;
    const match = input.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }

    // For android version 14 update
    const secondPattern = /statusBars frame=\[\d+,\d+\]\[\d+,(\d+)\]/;
    const secondMatch = input.match(secondPattern);
    if (secondMatch) {
      return parseInt(secondMatch[1], 10);
    }

    return null;
  } catch (e) {
    log.debug(e);
    return null;
  }
}

function extractNavigationBarHeight(input) {
  try {
    const pattern = /ITYPE_NAVIGATION_BAR frame=\[\d+,(\d+)\]\[\d+,(\d+)\]/;
    const match = input.match(pattern);
    if (match) {
      const bottom = parseInt(match[1], 10);
      const top = parseInt(match[2], 10);
      return top - bottom;
    }

    // For android version 14 update
    const secondPattern = /navigationBars frame=\[\d+,(\d+)\]\[\d+,(\d+)\]/;
    const secondMatch = input.match(secondPattern);
    if (secondMatch) {
      const bottom = parseInt(secondMatch[1], 10);
      const top = parseInt(secondMatch[2], 10);
      return top - bottom;
    }

    return null;
  } catch (e) {
    log.debug(e);
    return null;
  }
}

// Only these capability keys are forwarded to the Percy CLI/cloud. Everything
// else — notably bstack:options.accessKey/userName and other vendor secrets —
// is dropped so credentials never leave the tester's trust boundary
// (CWE-284/CWE-312). The CLI authenticates to BrowserStack using its own
// configured credentials, not these forwarded values.
const FORWARDED_CAPABILITY_KEYS = [
  'platformName', 'platform', 'deviceName', 'device',
  'osVersion', 'os_version', 'platformVersion', 'browserName',
  'orientation', 'percy:options', 'percyOptions'
];

function filterCapabilities(capabilities) {
  if (!capabilities || typeof capabilities !== 'object') return capabilities;
  const filtered = {};
  for (const key of FORWARDED_CAPABILITY_KEYS) {
    if (key in capabilities && capabilities[key] !== undefined) {
      filtered[key] = capabilities[key];
    }
  }
  return filtered;
}

// Strip any embedded user:pass@ credentials from a command executor URL before
// it is forwarded (CWE-312). Returns the origin+path without the userinfo.
function sanitizeCommandExecutorUrl(commandExecutorUrl) {
  if (!commandExecutorUrl || typeof commandExecutorUrl !== 'string') return commandExecutorUrl;
  try {
    const url = new URL(commandExecutorUrl);
    url.username = '';
    url.password = '';
    return url.toString();
  } catch (e) {
    // Not a parseable URL — fall back to a regex strip of the userinfo.
    return commandExecutorUrl.replace(/\/\/[^/@]+@/, '//');
  }
}

module.exports = {
  extractStatusBarHeight,
  extractNavigationBarHeight,
  filterCapabilities,
  sanitizeCommandExecutorUrl,
  FORWARDED_CAPABILITY_KEYS
};
