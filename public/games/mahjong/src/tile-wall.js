(function () {
  const TILE_DEFS = [
    ...Array.from({ length: 9 }, (_, i) => ({ suit: "character", rank: i + 1, label: `${i + 1}萬`, image: `Man${i + 1}.svg` })),
    ...Array.from({ length: 9 }, (_, i) => ({ suit: "dot", rank: i + 1, label: `${i + 1}筒`, image: `Pin${i + 1}.svg` })),
    ...Array.from({ length: 9 }, (_, i) => ({ suit: "bamboo", rank: i + 1, label: `${i + 1}條`, image: `Sou${i + 1}.svg` })),
    { suit: "wind", rank: 1, label: "東", image: "Ton.svg" },
    { suit: "wind", rank: 2, label: "南", image: "Nan.svg" },
    { suit: "wind", rank: 3, label: "西", image: "Shaa.svg" },
    { suit: "wind", rank: 4, label: "北", image: "Pei.svg" },
    { suit: "dragon-red", rank: 1, label: "中", image: "Chun.svg" },
    { suit: "dragon-green", rank: 2, label: "發", image: "Hatsu.svg" },
    { suit: "dragon-white", rank: 3, label: "白", image: "Haku.svg" },
    { suit: "flower", rank: 1, label: "春", image: "Flower1.svg" },
    { suit: "flower", rank: 2, label: "夏", image: "Flower2.svg" },
    { suit: "flower", rank: 3, label: "秋", image: "Flower3.svg" },
    { suit: "flower", rank: 4, label: "冬", image: "Flower4.svg" },
    { suit: "flower", rank: 5, label: "梅", image: "Flower5.svg" },
    { suit: "flower", rank: 6, label: "蘭", image: "Flower6.svg" },
    { suit: "flower", rank: 7, label: "竹", image: "Flower7.svg" },
    { suit: "flower", rank: 8, label: "菊", image: "Flower8.svg" }
  ];

  function makeWall() {
    const tiles = [];
    TILE_DEFS.forEach((tile, tileIndex) => {
      const copies = isFlower(tile) ? 1 : 4;
      for (let copy = 0; copy < copies; copy += 1) tiles.push({ ...tile, id: `${tileIndex}-${copy}`, order: tileIndex });
    });
    return shuffle(tiles);
  }

  function shuffle(items) {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function compareTiles(a, b) {
    return a.order - b.order || a.id.localeCompare(b.id);
  }

  function isFlower(tile) {
    return tile?.suit === "flower";
  }

  window.MahjongTileWall = { TILE_DEFS, compareTiles, isFlower, makeWall, shuffle };
})();
