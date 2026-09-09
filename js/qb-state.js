// qb-state.js
// Shared mutable state, DOM references, and small utility helpers used across
// every other qb-*.js file. Load after qb-storage.js, before everything else.
window.QB = window.QB || {};

QB.dom = {
    toggleEl: document.getElementById('toggle'),
    formEl: document.getElementById('point-form'),
    tbody: document.getElementById('points-tbody'),
    modeButtons: document.querySelectorAll('.mode-btn'),
    overlays: {
        front: document.getElementById('overlay-front'),
        back: document.getElementById('overlay-back')
    }
};

QB.state = {
    sides: ['front', 'back'],
    points: QB.storage.load(),
    mode: 'select',
    selectedPoint: null,
    dragging: null,       // point object currently being dragged
    pendingPoint: null,   // { side, x, y, id } waiting on the add/edit-point form
    tooltipEl: null,
    zoomState: {
        front: { scale: 1, originX: 50, originY: 50 },
        back: { scale: 1, originX: 50, originY: 50 }
    },
    panState: {
        front: { x: 0, y: 0 },
        back: { x: 0, y: 0 }
    },
    spaceHeld: false,
    lastMouse: { x: 0, y: 0 }
};

QB.util = {
    currentSide: function () {
        return QB.dom.toggleEl.checked ? 'back' : 'front';
    },

    // The one place that knows points live at points[side].positions, so
    // nothing else has to reach into that shape directly.
    positionsFor: function (side) {
        var bucket = QB.state.points[side];
        if (!bucket.positions) bucket.positions = [];
        return bucket.positions;
    },

     // Sequential ids (1, 2, 3, ...) instead of random uids - easy to label
    // on the board and easy to reference by number when sharing the JSON.
    // Shared across front AND back (not per-side) so e.g. back picks up
    // where front left off, rather than both starting over at 1. Based on
    // the current max rather than a stored counter, so deleting a point
    // doesn't cause id reuse or drift after import.
    nextId: function () {
        var max = 0;
        QB.state.sides.forEach(function (side) {
            QB.util.positionsFor(side).forEach(function (p) {
                max = Math.max(max, p.id || 0);
            });
        });
        return max + 1;
    }

    // Note: no export/save filtering helper needed here - qb-storage.js's
    // splitSide() builds the on-disk positions/data objects by explicitly
    // picking id/x/y and id/label/voltage/resistance/pinType, so runtime-only
    // fields like el/rowEl/side (attached to points by qb-points.js during
    // render) never get a chance to leak into what's persisted or exported.
};