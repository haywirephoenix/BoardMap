// qb-import.js
// Imports a previously-exported points JSON file (see the export-btn handler
// below) back into the app, replacing whatever is currently loaded.
//
// Requires a trigger button in your HTML: <button id="import-btn">Import</button>
// (mirrors the existing #export-btn). This module creates its own hidden
// <input type="file"> at init time, so no other markup is needed.
window.QB = window.QB || {};

QB.importer = (function () {
    var state = QB.state;

    function applyImportedData(data) {
        // Same merge used on normal load, so import accepts anything the
        // app can already load from localStorage (current split shape,
        // older merged shape, or the original flat-array shape) and gets
        // the same shared front/back id counter.
        state.points = QB.storage.mergeAll(data);
        state.selectedPoint = null;
        state.dragging = null;
        state.pendingPoint = null;

        QB.form.hide();
        QB.crosshair.hide();
        QB.storage.save(state.points);
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
            fileInput.value = ''; // allow re-selecting the same file twice in a row
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
            .then(function (data) {
                applyImportedData(data);
            })
            .catch(function (err) {
                console.warn('Could not auto-load json/board0.json:', err);
            });
    }

    function setupExportButton() {
        var exportBtn = document.getElementById('export-btn');

        if (!exportBtn) return;

        exportBtn.addEventListener('click', function () {
            // Same split used for localStorage, so the exported file and
            // what's saved locally are always in the exact same shape.
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

    function init() {
        setupImportButton();
        setupExportButton();
        loadDefaultBoard();
    }

    return {
        init: init
    };
})();