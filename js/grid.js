// Uniform spatial grid: finds nearby enemies without checking all of them.
(function (L) {
  'use strict';

  function Grid(cellSize) {
    this.cell = cellSize;
    this.cells = new Map();
  }

  Grid.prototype.key = function (cx, cy) { return (cx + 1024) * 4096 + (cy + 1024); };

  // Empties the cells but keeps their arrays to avoid garbage every frame.
  Grid.prototype.clear = function () {
    this.cells.forEach(function (arr) { arr.length = 0; });
  };

  Grid.prototype.insert = function (e) {
    var k = this.key(Math.floor(e.x / this.cell), Math.floor(e.y / this.cell));
    var arr = this.cells.get(k);
    if (!arr) { arr = []; this.cells.set(k, arr); }
    arr.push(e);
  };

  // Pushes into `out` every entity in the cells touching the circle. Callers filter by exact distance.
  Grid.prototype.query = function (x, y, r, out) {
    var c = this.cell;
    var x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
    var y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    for (var cx = x0; cx <= x1; cx++) {
      for (var cy = y0; cy <= y1; cy++) {
        var arr = this.cells.get(this.key(cx, cy));
        if (arr) for (var i = 0; i < arr.length; i++) out.push(arr[i]);
      }
    }
    return out;
  };

  L.Grid = Grid;
})(this.Lluvia = this.Lluvia || {});
