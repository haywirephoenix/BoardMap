// qb-main.js
// Wires everything together and kicks off the app. Load this LAST.
window.QB = window.QB || {};

(function () {
    QB.zoomPan.init();
    QB.crosshair.init();
    QB.form.init();
    QB.points.init();
    QB.modes.init();
    QB.importer.init();

    QB.modes.set('select');
    QB.table.render();
})();