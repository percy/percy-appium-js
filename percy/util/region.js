class Region {
  constructor(top, bottom, left, right) {
    if (top < 0 || bottom < 0 || left < 0 || right < 0) {
      throw new Error('Only Positive integer is allowed!');
    }

    if (top >= bottom || left >= right) {
      throw new Error('Invalid ignore region parameters!');
    }

    this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
  }

  isValid(screenHeight, screenWidth) {
    if (
      this.top >= screenHeight ||
            this.bottom > screenHeight ||
            this.left >= screenWidth ||
            this.right > screenWidth) {
      return false;
    }

    return true;
  }
}

module.exports = {
  Region
};
