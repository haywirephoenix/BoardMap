// qb-import.js
window.QB = window.QB || {};

QB.importer = (function () {
    var state = QB.state;
    var CLEARED_FLAG_KEY = 'qb-board-cleared';

    function resetView() {
        state.selectedPoint = null;
        state.dragging = null;
        state.pendingPoint = null;
        QB.form.hide();
        QB.crosshair.hide();
    }

    function applyImportedData(data) {
        // Same merge used on normal load, so import accepts anything the
        // app can already load from localStorage (current split shape,
        // older merged shape, or the original flat-array shape) and gets
        // the same shared front/back id counter.
        state.points = QB.storage.mergeAll(data);
        resetView();
        QB.storage.save(state.points);
        // Real data is now present, so stop suppressing the auto-default
        // load on future page loads.
        localStorage.removeItem(CLEARED_FLAG_KEY);
        QB.points.render();
        QB.table.render();
    }

    function handleFile(file) {
        var reader = new FileReader();
        reader.onload = function () {
            var data;
            try {
                data = JSON.parse(reader.result);
            } catch (e) {
                alert('That file is not valid JSON.');
                return;
            }
            if (!data || typeof data !== 'object') {
                alert('Unexpected file format.');
                return;
            }
            applyImportedData(data);
        };
        reader.onerror = function () {
            alert('Could not read that file.');
        };
        reader.readAsText(file);
    }

    function setupImportButton() {
        var importBtn = document.getElementById('import-btn');
        if (!importBtn) return;

        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'application/json,.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        importBtn.addEventListener('click', function () {
            fileInput.value = '';
            fileInput.click();
        });

        fileInput.addEventListener('change', function () {
            if (fileInput.files && fileInput.files[0]) {
                handleFile(fileInput.files[0]);
            }
        });
    }

    function loadDefaultBoard() {
        fetch('json/board0.json')
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(applyImportedData)
            .catch(function (err) {
                console.warn('Could not auto-load json/board0.json:', err);
            });
    }

    function shouldAutoLoadDefault() {
        // User explicitly cleared the board - respect that until they
        // import something or hit "load default" themselves.
        if (localStorage.getItem(CLEARED_FLAG_KEY)) return false;

        // Otherwise, only auto-load if there's genuinely nothing saved yet
        // (covers the case where load() returns an empty-but-present shape).
        var hasPoints = QB.state.sides.some(function (side) {
            return QB.util.positionsFor(side).length > 0;
        });
        return !hasPoints;
    }

    function setupExportButton() {
        var exportBtn = document.getElementById('export-btn');
        if (!exportBtn) return;

        exportBtn.addEventListener('click', function () {
            var data = {
                front: QB.storage.splitSide(QB.state.points.front),
                back: QB.storage.splitSide(QB.state.points.back)
            };
            var json = JSON.stringify(data, null, 2);
            var blob = new Blob([json], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'quest-board-points.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    function clearAll() {
        state.points = QB.storage.emptyPoints();
        resetView();
        QB.storage.save(state.points);
        localStorage.setItem(CLEARED_FLAG_KEY, '1');
        QB.points.render();
        QB.table.render();
    }

    function init() {
        setupImportButton();
        setupExportButton();

        var clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAll);
        }

        var loadDefBtn = document.getElementById('load-default-btn');
        if (loadDefBtn) {
            loadDefBtn.addEventListener('click', loadDefaultBoard);
        }

        if (shouldAutoLoadDefault()) {
            loadDefaultBoard();
        }
    }

    return {
        init: init
    };
})();