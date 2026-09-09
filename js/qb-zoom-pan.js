// qb-zoom-pan.js
// Scroll-to-zoom (per side, centered on cursor) and space+drag panning.
window.QB = window.QB || {};

QB.zoomPan = (function () {
    var state = QB.state;
    var dom = QB.dom;

    function applyZoom(side) {
        var boardEl = document.getElementById(side);
        var z = state.zoomState[side];
        var p = state.panState[side];
        boardEl.style.transformOrigin = z.originX + '% ' + z.originY + '%';
        boardEl.style.transform = 'translate(' + p.x + 'px, ' + p.y + 'px) scale(' + z.scale + ')';

        if (state.pendingPoint && state.pendingPoint.side === side) {
            QB.form.reposition();
        }
    }

    function init() {
        state.sides.forEach(function (side) {
            dom.overlays[side].addEventListener('wheel', function (e) {
                e.preventDefault();
                var rect = dom.overlays[side].getBoundingClientRect();
                var originX = ((e.clientX - rect.left) / rect.width) * 100;
                var originY = ((e.clientY - rect.top) / rect.height) * 100;

                var z = state.zoomState[side];
                var factor = e.deltaY < 0 ? 1.1 : 0.9;
                z.scale = Math.min(4, Math.max(1, z.scale * factor));
                z.originX = originX;
                z.originY = originY;
                applyZoom(side);
            }, { passive: false });

            // double-click to reset zoom on that side
            dom.overlays[side].addEventListener('dblclick', function () {
                state.zoomState[side] = { scale: 1, originX: 50, originY: 50 };
                state.panState[side] = { x: 0, y: 0 };
                applyZoom(side);
            });
        });

        var lastMouse = state.lastMouse;

        window.addEventListener('keydown', function (e) {
            if (e.code === 'Space') {
                state.spaceHeld = true;
                // e.preventDefault(); // stop the page from scrolling
            }
        });

        window.addEventListener('keyup', function (e) {
            if (e.code === 'Space') state.spaceHeld = false;
        });

        document.addEventListener('mousemove', function (e) {
            if (!state.spaceHeld) {
                lastMouse.x = e.clientX;
                lastMouse.y = e.clientY;
                return;
            }
            var side = QB.util.currentSide();
            var dx = e.clientX - lastMouse.x;
            var dy = e.clientY - lastMouse.y;
            state.panState[side].x += dx;
            state.panState[side].y += dy;
            lastMouse.x = e.clientX;
            lastMouse.y = e.clientY;
            applyZoom(side);
        });
    }

    return {
        init: init,
        applyZoom: applyZoom
    };
})();
