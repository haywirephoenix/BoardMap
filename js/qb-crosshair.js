// qb-crosshair.js
// Crosshair guide lines shown while in "add point" mode.
window.QB = window.QB || {};

QB.crosshair = (function () {
    var state = QB.state;
    var dom = QB.dom;
    var crosshairLines = {};

    function init() {
        state.sides.forEach(function (side) {
            var h = document.createElement('div');
            h.className = 'crosshair-line horizontal';
            var v = document.createElement('div');
            v.className = 'crosshair-line vertical';
            dom.overlays[side].appendChild(h);
            dom.overlays[side].appendChild(v);
            crosshairLines[side] = { h: h, v: v };
        });

        state.sides.forEach(function (side) {
            dom.overlays[side].addEventListener('mousemove', function (e) {
                if (QB.state.mode !== 'add') return;
                var rect = dom.overlays[side].getBoundingClientRect();
                var xPct = ((e.clientX - rect.left) / rect.width) * 100;
                var yPct = ((e.clientY - rect.top) / rect.height) * 100;
                crosshairLines[side].h.style.display = 'block';
                crosshairLines[side].h.style.top = yPct + '%';
                crosshairLines[side].v.style.display = 'block';
                crosshairLines[side].v.style.left = xPct + '%';
            });
            dom.overlays[side].addEventListener('mouseleave', function () {
                if (QB.state.mode === 'add') hide();
            });
        });
    }

    function hide() {
        state.sides.forEach(function (side) {
            crosshairLines[side].h.style.display = 'none';
            crosshairLines[side].v.style.display = 'none';
        });
    }

    return {
        init: init,
        hide: hide
    };
})();
