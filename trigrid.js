
const Trigrid = (() => {
    
    const heightCoef = Math.sqrt(3.0) / 2.0;
    const epsilon = 0.001;

    const almostEqual = (x, y) => {
        return Math.abs(x - y) < epsilon;
    }

    const count = (() => {
        let counter = 0;
        return () => {
            return counter++;
        };
    })();

    class GridMap {
        constructor() {
            this._data = {};
        }

        get(x, y) {
            return this._data[x] && this._data[x][y];
        }

        set(x, y, value) {
            if (!this._data[x]) {
                this._data[x] = {};
            }
            this._data[x][y] = value;
        }

        exists(x, y) {
            return this._data[x] && this._data[x][y] !== undefined;
        }

        forEach(iter) {
            return Object.values(this._data).forEach(row => Object.values(row).forEach(x => iter(x)));
        }

        map(iter) {
            const vals = [];
            this.forEach(x => {
                vals.push(iter(x));
            });
            return vals;
        }
    }

    class Vertex {
        constructor(pos, left, right) {
            this.id = count();
            this.pos = pos;
            this.left = left;
            this.right = right;
        }
    }

    class Triangle {
        constructor(grid, row, column) {
            this.grid = grid;
            this.row = row;
            this.column = column;
            this.upright = column % 2 === 0;

            this._scale = null;
            this._vertices = null;
        }

        vertices() {
            if (this._scale === this.grid.scale) {
                return this._vertices;
            } else {
                const top = (this.row + 1) * heightCoef * this.grid.scale;
                const bottom = this.row * heightCoef * this.grid.scale;
    
                const middle = this.column * 0.5 * this.grid.scale;
                const halfWidth = 0.5 * this.grid.scale;

                const xoffset = (this.row % 2 === 0) ? 0 : halfWidth;
                
                let vertices;
                // triangle is upright (base on bottom)
                if (this.column % 2 === 0) {
                    vertices = [
                        [xoffset + middle - halfWidth, bottom],
                        [xoffset + middle, top],
                        [xoffset + middle + halfWidth, bottom]
                    ];
                // triangle is upside-down (base on top)
                } else {
                    vertices = [
                        [xoffset + middle - halfWidth, top],
                        [xoffset + middle + halfWidth, top],
                        [xoffset + middle, bottom]
                    ];
                }

                this._scale = this.grid.scale;
                this._vertices = vertices;

                return vertices;
            }
        }

        neighbours() {
            return [
                this.grid.get(this.row, this.column + 1),
                this.grid.get(this.row, this.column - 1),
                this.grid.get(this.row + (this.upright ? -1 : 1), this.column + (this.row % 2 === 0 ? -1 : 1))
            ];
        }

        neighbourVertices(neighbourIndex) {
            const verts = this.vertices();
            if (neighbourIndex === 0) {
                if (this.column % 2 === 0) {
                    return [verts[1], verts[2]]
                } else {
                    return [verts[1], verts[2]]
                }
            } else if (neighbourIndex === 1) {
                if (this.column % 2 === 0) {
                    return [verts[0], verts[1]]
                } else {
                    return [verts[0], verts[2]]
                }
            } else {
                if (this.column % 2 === 0) {
                    return [verts[0], verts[2]]
                } else {
                    return [verts[0], verts[1]]
                }
            }
        }
    }

    class Zone {
        constructor(grid, data) {
            this.grid = grid;
            this.triangles = new GridMap();

            if (data) {
                data.forEach(([r, c]) => this.add(r, c));
            }

            this._vertices = null;
        }

        add(row, column) {
            this._fullverts = null;
            this._vertices = null;
            this.triangles.set(row, column, this.grid.get(row, column));
            return this;
        }

        has(tri) {
            return this.triangles.exists(tri.row, tri.column);
        }

        border() {
            const visited = new GridMap();
            const vertices = new GridMap();
            const add = (vertex) => {
                vertices.set(Math.round(vertex.pos[0]), Math.round(vertex.pos[1]), vertex)
            };
            const get = (vertex) => {
                return vertices.get(Math.round(vertex[0]), Math.round(vertex[1]));
            }

            // pick an arbitrary triangle to start at
            const start = Object.values(Object.values(this.triangles._data)[0])[0];

            const verts = start.vertices().map(v => new Vertex(v, null, null));
            verts.forEach(add);

            verts[0].left = verts[2];
            verts[0].right = verts[1];
            verts[1].left = verts[0];
            verts[1].right = verts[2];
            verts[2].left = verts[1];
            verts[2].right = verts[0];

            visited.set(start.row, start.column, true);

            let todo = [start];
            let latestVert = verts[0];

            while (todo.length > 0) {
                const newTodo = [];
                todo.forEach(tri => {
                    tri.neighbours().forEach((ntri, ni) => {
                        if (this.has(ntri) && !visited.exists(ntri.row, ntri.column)) {
                            const nvertpos = tri.neighbourVertices(ni);
                            const nverts = nvertpos.map(get);
                            console.log(vertices)
                            console.log(nvertpos);
                            console.log(nverts);
                            const thirdVertPos = ntri.vertices().find(v => nvertpos.every(nv => !almostEqual(v[0], nv[0]) || !almostEqual(v[1], nv[1])));

                            console.log(thirdVertPos)
                            let thirdVert = get(thirdVertPos);
                            if (thirdVert) {
                                // one of the neighbour vertices are joined to the third vert by a 2-length path, we want to join these two directly
                                const nvert = nverts.find(v => v.left.left.id === thirdVert.id || v.right.right.id === thirdVert.id);
                                if (nvert.left.left.id === thirdVert.id) {
                                    nvert.left = thirdVert;
                                } else {
                                    nvert.right = thirdVert;
                                }

                                if (thirdVert.left.left.id === nvert.id) {
                                    thirdVert.left = nvert;
                                } else {
                                    thirdVert.right = nvert;
                                }
                            } else {
                                thirdVert = new Vertex(thirdVertPos, nverts[0], nverts[1]);
                                add(thirdVert);
                                latestVert = thirdVert;

                                nverts.forEach((overt, i) => {
                                    const oi = i === 0 ? 1 : 0;
                                    if (overt.left.id === nverts[oi].id) {
                                        overt.left = thirdVert;
                                    } else {
                                        overt.right = thirdVert;
                                    }
                                });
                            }

                            visited.set(ntri.row, ntri.column, ntri);
                            newTodo.push(ntri);
                        }
                    });
                });
                todo = newTodo;
            }

            const path = [latestVert.pos];
            let cur = latestVert.left;
            let last = latestVert;
            while (cur.id !== latestVert.id) {
                path.push(cur.pos);
                if (cur.left.id === last.id) {
                    cur = cur.right;
                } else {
                    cur = cur.left;
                }
                last = cur;
            }

            return path;
        }
    }

    class Trigrid {
        constructor(scale) {
            this.scale = scale;
            this.triangles = new GridMap();
        }

        get(row, column) {
            return this.triangles.get(row, column);
        }

        add(row, column) {
            const triangle = new Triangle(this, row, column);
            this.triangles.set(row, column, triangle);
            return triangle;
        }

        zone(data) {
            return new Zone(this, data);
        }

        getOrAdd(row, column) {
            if (this.triangles.exists(row, column)) {
                return this.triangles.get(row, column);
            } else {
                return this.add(row, column)
            }
        }

        fromPoint(x, y) {
            const height = heightCoef * this.scale;
            const halfWidth = 0.5 * this.scale;

            const row = Math.floor(y / height);
            let halfColumn = Math.floor(x / halfWidth);
            
            const tx = (x - (halfColumn * halfWidth)) / halfWidth;
            const ty = (y - (row * height)) / height;
            
            if (row % 2 !== 0) {
                halfColumn -= 1;
            }

            if (halfColumn % 2 == 0) {
                // left corner
                if (tx <= (1 - ty)) {
                    return this.get(row, halfColumn);
                } else {
                    return this.get(row, halfColumn + 1);
                }
            } else {
                // right corner
                if (tx >= ty) {
                    return this.get(row, halfColumn + 1);
                } else {
                    return this.get(row, halfColumn);
                }
            }
        }

        forEach(iter) {
            this.triangles.forEach(iter);
        }
    }

    return Trigrid;
})();
