class Tile {
  constructor({
    filepath,
    sha,
    statusBarHeight,
    navBarHeight,
    headerHeight,
    footerHeight,
    fullscreen
  }) {
    this.filepath = filepath;
    this.sha = sha;
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
