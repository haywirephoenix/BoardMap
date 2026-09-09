// qb-table.js
// Renders the points table for the currently active side, with inline editing
// for label, voltage, resistance, and pin type (the swatch cell is a
// read-only preview of the pin-<type> CSS color, and doubles as a shortcut
// to the same pin-type dropdown as the pinType cell).
window.QB = window.QB || {};

QB.table = (function () {
    var state = QB.state;
    var dom = QB.dom;

    function render() {
        var side = QB.util.currentSide();
        dom.tbody.innerHTML = '';
        QB.util.positionsFor(side).forEach(function (pt) {
            var tr = document.createElement('tr');
            tr.className = `pin-${pt.pinType}`
            tr.className += (state.selectedPoint === pt) ?  'selected' : '';
            tr.dataset.id = pt.id;
            pt.rowEl = tr;
            tr.addEventListener('mouseover', QB.points.onPointHover(pt, { scroll: false }));

            // var tdSwatch = document.createElement('td');
            // tdSwatch.className = 'swatch-cell';
            // tdSwatch.title = 'Click to edit';
            // renderSwatchCell(tdSwatch, pt);
            // tdSwatch.addEventListener('click', function (e) {
            //     e.stopPropagation();
            //     startEditingPinType(tdSwatch, tdPinType, pt);
            // });

            var tdID = document.createElement('td');
            tdID.className = 'id-cell';
            tdID.textContent = pt.id;

            var tdLabel = document.createElement('td');
            tdLabel.className = 'label-cell';
            tdLabel.textContent = pt.label;
            tdLabel.title = 'Click to edit';
            tdLabel.addEventListener('click', function (e) {
                e.stopPropagation();
                startEditingText(tdLabel, pt, 'label', ' ');
            });

            var tdVoltage = document.createElement('td');
            tdVoltage.className = 'voltage-cell';
            tdVoltage.textContent = pt.voltage;
            tdVoltage.title = 'Click to edit';
            tdVoltage.addEventListener('click', function (e) {
                e.stopPropagation();
                startEditingText(tdVoltage, pt, 'voltage', '');
            });

            var tdResistance = document.createElement('td');
            tdResistance.className = 'resistance-cell';
            tdResistance.textContent = pt.resistance;
            tdResistance.title = 'Click to edit';
            tdResistance.addEventListener('click', function (e) {
                e.stopPropagation();
                startEditingText(tdResistance, pt, 'resistance', '');
            });

            var tdPinType = document.createElement('td');
            tdPinType.className = 'pinType-cell';
            tdPinType.title = 'Click to edit';
            tdPinType.textContent = pt.pinType;
            tdPinType.addEventListener('click', function (e) {
                e.stopPropagation();
                startEditingPinType(tdPinType, pt);
            });

            var tdX = document.createElement('td');
            tdX.className = 'XPos-cell';
            tdX.textContent = (pt.x * 100).toFixed(1);

            var tdY = document.createElement('td');
            tdY.className = 'YPos-cell';
            tdY.textContent = (pt.y * 100).toFixed(1);

            var tdDel = document.createElement('td');
            var delBtn = document.createElement('button');
            delBtn.className = 'row-delete';
            delBtn.textContent = '\u2715';
            delBtn.title = 'Delete point';
            delBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                QB.points.remove(pt);
            });
            tdDel.appendChild(delBtn);

            // tr.appendChild(tdSwatch);
            tr.appendChild(tdID);
            tr.appendChild(tdVoltage);
            tr.appendChild(tdResistance);
            tr.appendChild(tdPinType);
            tr.appendChild(tdLabel);
            tr.appendChild(tdX);
            tr.appendChild(tdY);
            tr.appendChild(tdDel);

            tr.addEventListener('click', function () { QB.points.select(pt); });

            dom.tbody.appendChild(tr);
        });
    }

    // ---- generic text-field editing (label, voltage, resistance) ----
    function startEditingText(td, pt, field, fallback) {
        if (td.querySelector('input')) return; // already editing this cell

        var input = document.createElement('input');
        input.type = 'text';
        input.className = field + '-input';
        input.value = String(pt[field]).trim();
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.fontSize = '8px';
        input.style.background = "#262626";
        input.style.color = '#ffffff';
        input.style.border = '0';

        td.textContent = '';
        td.appendChild(input);
        input.focus();
        input.select();

        function commit() {
            var newValue = input.value.trim() || fallback;
            pt[field] = newValue;
            QB.storage.save(state.points);
            td.textContent = newValue;
        }

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                input.blur(); // triggers commit above
            } else if (e.key === 'Escape') {
                input.value = String(pt[field]).trim();
                input.blur();
            }
        });
    }

    // ---- swatch: read-only preview, driven entirely by pt.pinType ----
    function renderSwatchCell(td, pt) {
        td.textContent = '';
        var swatch = document.createElement('div');
        swatch.className = 'swatch pin-' + pt.pinType;
        td.appendChild(swatch);
    }

    // ---- pin type editing (dropdown sourced from PIN_CONFIG) ----
    // Shared by the swatch cell and the pinType cell so both stay in sync.
    function startEditingPinType(pinTypeTd, pt) {
        if (pinTypeTd.querySelector('select')) return; // already editing

        var select = document.createElement('select');
        select.style.width = '100%';
        select.style.fontSize = '8px';
        select.style.background = '#262626';
        select.style.color = '#ffffff';
        select.style.border = '0';

        Object.entries(PIN_CONFIG).forEach(function ([pinType, config]) {
            var option = document.createElement('option');
            option.value = pinType;
            option.textContent = config.label;
            if (pinType === pt.pinType) option.selected = true;
            select.appendChild(option);
        });

        pinTypeTd.textContent = '';
        pinTypeTd.appendChild(select);
        select.focus();

        var committed = false;
        function commit() {
            if (committed) return;
            committed = true;
            pt.pinType = select.value;
            QB.storage.save(state.points);
            pinTypeTd.textContent = pt.pinType;
            // renderSwatchCell(swatchTd, pt);
            QB.points.render(); // the point on the board should match too
        }

        select.addEventListener('change', commit);
        select.addEventListener('blur', function () {
            if (pinTypeTd.contains(select)) commit();
        });
    }

    function highlightPointRow(pt) {
        if (!pt) return;
        if (pt.el) pt.el.classList.add('selected');
        if (pt.rowEl) pt.rowEl.classList.add('selected');
    }

    function deselectPointRow(pt) {
        if (!pt) return;
        if (pt.el) pt.el.classList.remove('selected');
        if (pt.rowEl) pt.rowEl.classList.remove('selected');
    }

    function scrollToPointRow(pt) {
        if (pt && pt.rowEl) {
            pt.rowEl.scrollIntoView({
                behavior: 'instant',
                block: 'start',
                container: 'nearest'
            });
        }
    }

    return {
        render: render,
        highlightPointRow: highlightPointRow,
        deselectPointRow: deselectPointRow,
        scrollToPointRow: scrollToPointRow
    };
})();