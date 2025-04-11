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

module.exports = {
  extractStatusBarHeight,
  extractNavigationBarHeight
};
