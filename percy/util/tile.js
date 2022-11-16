class Tile {
  constructor({
    filepath,
    statusBarHeight,
    navBarHeight,
    headerHeight,
    footerHeight,
    fullscreen
  }) {
    this.filepath = filepath;
    this.statusBarHeight = statusBarHeight;
    this.navBarHeight = navBarHeight;
    this.headerHeight = headerHeight;
    this.footerHeight = footerHeight;
    this.fullscreen = fullscreen;
  }
}

module.exports = {
  Tile
};
