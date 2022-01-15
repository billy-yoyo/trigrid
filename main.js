
const main = () => {
    const canvas = document.getElementById('canvas');
    const label = document.getElementById('label');
    const ctx = canvas.getContext('2d');

    const grid = new Trigrid(50);
    for (let i = -10; i < 11; i++) {
        for (let j = -10; j < 11; j++) {
            grid.add(i, j);
        }
    }

    const zone = grid.zone([
        [0, 0], [0, 1], [0, -1], [0, -2]
    ]);
    const border = zone.border();
    console.log(border);

    const ox = canvas.clientWidth / 2;
    const oy = canvas.clientHeight / 2;

    const selected = {x: 0, y: 0, tri: null};

    const cen = grid.get(1, 2);
    const tris = cen.neighbours();

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        selected.x = x - ox;
        selected.y = y - oy;
        selected.tri = grid.fromPoint(x - ox, y - oy);
        if (selected.tri) {
            label.textContent = `row: ${selected.tri.row}, column: ${selected.tri.column}`
        }
    });

    const render = () => {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        ctx.strokeStyle = '#000';
        grid.forEach(tri => {
            const verts = tri.vertices();
    
            ctx.beginPath();
            ctx.moveTo(ox + verts[0][0], oy + verts[0][1]);
            ctx.lineTo(ox + verts[1][0], oy + verts[1][1]);
            ctx.lineTo(ox + verts[2][0], oy + verts[2][1]);
            ctx.closePath();
            ctx.stroke();
    
            if (selected.tri && tri.row === selected.tri.row && tri.column === selected.tri.column) {
                ctx.fillStyle = '#f00';
                ctx.fill();
            } else if (tri.row === cen.row && tri.column === cen.column) {
                ctx.fillStyle = '#00f';
                ctx.fill();
            } else if (tris.some(t => t.row === tri.row && t.column === tri.column)) {
                ctx.fillStyle = '#0f0';
                ctx.fill();
            }
        });

        ctx.beginPath();
        border.forEach((v, i) => {
            if (i === 0) {
                ctx.moveTo(ox + v[0], oy + v[1]);
            } else {
                ctx.lineTo(ox + v[0], oy + v[1]);
            }
        });
        ctx.closePath();
        ctx.strokeStyle = '#f00';
        ctx.stroke();
    }

    setInterval(render, 10);
};
