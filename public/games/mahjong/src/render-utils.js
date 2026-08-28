(function () {
  const HTML_ESCAPE_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  const byId = id => document.getElementById(id);

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, char => HTML_ESCAPE_MAP[char]);
  }

  function tileImageSrc(tile) {
    if (!tile?.image) return "";
    return `assets/tiles/regular/${tile.image}`;
  }

  function makeTileImage(tile) {
    const fragment = document.createDocumentFragment();
    const fallback = document.createElement("span");
    fallback.className = "tile-fallback";
    fallback.textContent = tile.label;
    const src = tileImageSrc(tile);
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = tile.label;
      img.loading = "lazy";
      img.addEventListener("error", () => {
        img.remove();
        fallback.style.display = "grid";
      });
      fragment.appendChild(img);
    } else {
      fallback.style.display = "grid";
    }
    fragment.appendChild(fallback);
    return fragment;
  }

  function makeSmallTile(tile, options = {}) {
    const el = document.createElement("span");
    const animateFlower = !!options.animateFlower;
    const isFlowerTile = options.isFlowerTile || (() => false);
    el.className = `tile small ${tile.suit}${animateFlower && isFlowerTile(tile) ? " flower-fly" : ""}`;
    el.title = tile.label;
    el.appendChild(makeTileImage(tile));
    return el;
  }

  window.MahjongRender = { byId, escapeHtml, makeSmallTile, makeTileImage, tileImageSrc };
})();
