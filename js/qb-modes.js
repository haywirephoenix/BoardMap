// qb-modes.js
// Mode switching (select / add / move / remove) and the front/back side toggle.
window.QB = window.QB || {};

QB.modes = (function () {
    var state = QB.state;
    var dom = QB.dom;

    function setMode(newMode) {
        state.mode = newMode;
        dom.modeButtons.forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.mode === state.mode);
        });
        state.sides.forEach(function (side) {
            dom.overlays[side].classList.remove('mode-select', 'mode-add', 'mode-move', 'mode-remove');
            dom.overlays[side].classList.add('mode-' + state.mode);
        });
        QB.crosshair.hide();
        QB.form.hide();
        QB.points.render();
    }

    function init() {
        dom.modeButtons.forEach(function (btn) {
            btn.addEventListener('click', function () { setMode(btn.dataset.mode); });
        });

        dom.toggleEl.addEventListener('change', function () {
            state.selectedId = null;
            QB.form.hide();
            QB.crosshair.hide();
            QB.points.render();
            QB.table.render();
        });
    }

    return {
        init: init,
        set: setMode
    };
})();
