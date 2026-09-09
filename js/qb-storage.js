// qb-storage.js
// Handles persisting/loading point data to localStorage, and converting
// between two shapes:
//   - on-disk / exported: { positions: [{id,x,y}], data: [{id,label,voltage,resistance,pinType}] }
//   - runtime (what points.js / table.js / form.js work with): a single
//     merged array of { id, x, y, label, voltage, resistance, pinType }
// Load first: nothing else depends on anything, and qb-state.js needs QB.storage.load().
window.QB = window.QB || {};

QB.storage = (function () {
    var STORAGE_KEY = 'questBoardMapPoints';

    function emptyPoints() {
        return {
            front: { positions: [] },
            back: { positions: [] }
        };
    }

    // ---- on-disk (split) -> runtime (merged) ----
    // Accepts the current split shape, the older merged-array shape, or the
    // original flat-array-per-side shape - in every case a position entry
    // either has its own voltage/resistance/pinType/label, or there's a
    // matching `data` entry with the same id to pull them from.
    // startId lets ids continue across sides (see mergeAll) instead of each
    // side restarting its own numbering at 1; returns the next free id too
    // so the caller can hand it to the next side.
    function mergeSide(sideData, startId) {
        var positions = Array.isArray(sideData) ? sideData
            : (sideData && Array.isArray(sideData.positions)) ? sideData.positions
            : [];
        var dataList = (sideData && Array.isArray(sideData.data)) ? sideData.data : [];
 
        var dataById = {};
        dataList.forEach(function (d) { if (d && d.id != null) dataById[d.id] = d; });
 
        var nextId = startId || 1;
        var merged = positions.map(function (p) {
            var d = dataById[p && p.id] || p || {};
            return {
                id: nextId++, // always renumbered sequentially, old id only used for the data lookup above
                x: (p && typeof p.x === 'number') ? p.x : 0,
                y: (p && typeof p.y === 'number') ? p.y : 0,
                label: (typeof d.label === 'string') ? d.label : ' ',
                voltage: (typeof d.voltage === 'string') ? d.voltage : '',
                resistance: (typeof d.resistance === 'string') ? d.resistance : '',
                pinType: (typeof d.pinType === 'string') ? d.pinType : PinType.OTHER
            };
        });
 
        return { side: { positions: merged }, nextId: nextId };
    }

    // Merges both sides with one shared id counter, so back continues
    // numbering where front left off rather than both starting at 1.
    function mergeAll(raw) {
        raw = raw || {};
        var frontResult = mergeSide(raw.front, 1);
        var backResult = mergeSide(raw.back, frontResult.nextId);
        return { front: frontResult.side, back: backResult.side };
    }

    // ---- runtime (merged) -> on-disk (split) ----
    function splitSide(sideBucket) {
        var merged = (sideBucket && Array.isArray(sideBucket.positions)) ? sideBucket.positions : [];
        return {
            positions: merged.map(function (p) {
                return { id: p.id, x: p.x, y: p.y };
            }),
            data: merged.map(function (p) {
                return { id: p.id, label: p.label, voltage: p.voltage, resistance: p.resistance, pinType: p.pinType };
            })
        };
    }
 
    function loadPoints() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return mergeAll(JSON.parse(raw));
        } catch (e) {
            console.warn('Could not load saved points, starting fresh.', e);
        }
        return emptyPoints();
    }
 
    function savePoints(points) {
        try {
            var onDisk = {
                front: splitSide(points.front),
                back: splitSide(points.back)
            };
            // splitSide explicitly picks only id/x/y and id/label/voltage/
            // resistance/pinType, so runtime-only fields like el/rowEl never
            // get a chance to leak into what's persisted.
            localStorage.setItem(STORAGE_KEY, JSON.stringify(onDisk));
        } catch (e) {
            console.warn('Could not save points.', e);
        }
    }
 
    return {
        STORAGE_KEY: STORAGE_KEY,
        emptyPoints: emptyPoints,
        mergeSide: mergeSide,
        mergeAll: mergeAll,
        splitSide: splitSide,
        load: loadPoints,
        save: savePoints
    };
})();