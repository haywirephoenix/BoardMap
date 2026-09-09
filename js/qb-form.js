// qb-form.js
// The small popup form used to add a new point, or edit an existing one
// (voltage, resistance, pin type).
window.QB = window.QB || {};

QB.form = (function () {
    var state = QB.state;
    var dom = QB.dom;
    var pinTypeSelect;

    function initPinTypeSelect(parentId = 'point-form') {
        const formContainer = document.getElementById(parentId);
        if (!formContainer) return;

        const select = formContainer.querySelector('#pf-pintype');
        const voltageInput = formContainer.querySelector('#pf-voltage');
        const resistanceInput = formContainer.querySelector('#pf-resistance');

        if (!select) return;

        pinTypeSelect = select;

        select.innerHTML = '';
        Object.entries(PIN_CONFIG).forEach(([pinType, config]) => {
            const option = document.createElement('option');
            option.value = pinType;
            option.textContent = config.label;
            select.appendChild(option);
        });

        [voltageInput, resistanceInput].forEach(input => {
            if (!input) return;
            input.addEventListener('input', () => {
                input.dataset.userModified = 'true';
            });
        });

        select.addEventListener('change', () => {
            const selectedType = select.value;
            const config = PIN_CONFIG[selectedType];
            if (!config) return;

            // The select itself still gets its background from PIN_CONFIG for
            // a quick visual preview - this is just form chrome, not persisted
            // point data (points get their color from the pin-<type> CSS class).
            updateSelectStyling(select, config.color);

            if (voltageInput && (voltageInput.dataset.userModified !== 'true' || voltageInput.value.trim() === '')) {
                voltageInput.value = config.voltage || '';
                voltageInput.dataset.userModified = 'false';
            }

            if (resistanceInput && (resistanceInput.dataset.userModified !== 'true' || resistanceInput.value.trim() === '')) {
                resistanceInput.value = config.resistance || '';
                resistanceInput.dataset.userModified = 'false';
            }
        });
    }

    function updateSelectStyling(selectElement, hexColor) {
        if (!selectElement || !hexColor) return;
        selectElement.style.backgroundColor = hexColor;
        selectElement.style.color = getContrastingTextColor(hexColor);
    }

    function getContrastingTextColor(hexColor) {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 128 ? '#000000' : '#ffffff';
    }

    function init() {
        initPinTypeSelect('point-form');

        state.sides.forEach(function (side) {
            dom.overlays[side].addEventListener('click', function (e) {
                if (QB.state.mode !== 'add') return;
                if (e.target !== dom.overlays[side]) return;
                var rect = dom.overlays[side].getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width;
                var y = (e.clientY - rect.top) / rect.height;
                openForm(side, x, y, e.clientX, e.clientY);
            });
        });

        document.getElementById('pf-cancel').addEventListener('click', hideForm);

        document.getElementById('pf-add').addEventListener('click', function () {
            if (!state.pendingPoint) return;
            var voltage = document.getElementById('pf-voltage').value.trim();
            var resistance = document.getElementById('pf-resistance').value.trim();
            var pinType = document.getElementById('pf-pintype').value || PinType.OTHER;
            var side = state.pendingPoint.side;
            var positions = QB.util.positionsFor(side);

            if (state.pendingPoint.id != null) {
                var pt = positions.find(function (p) { return p.id === state.pendingPoint.id; });
                if (pt) {
                    pt.voltage = voltage || '';
                    pt.resistance = resistance || '';
                    pt.pinType = pinType;
                }
            } else {
                var point = {
                    id: QB.util.nextId(), // shared across front+back, not per-side
                    x: state.pendingPoint.x,
                    y: state.pendingPoint.y,
                    label: ' ',
                    voltage: voltage || '',
                    resistance: resistance || '',
                    pinType: pinType
                };
                positions.push(point);
            }

            QB.storage.save(state.points);
            hideForm();
            QB.points.render();
            QB.table.render();
        });
    }

    function openForm(side, x, y, clientX, clientY, existingPoint) {
        state.pendingPoint = { side: side, x: x, y: y, id: existingPoint ? existingPoint.id : null };

        var voltageInput = document.getElementById('pf-voltage');
        var resistanceInput = document.getElementById('pf-resistance');
        var pinTypeInput = document.getElementById('pf-pintype');
        var submitBtn = document.getElementById('pf-add');

        if (existingPoint) {
            var currentType = existingPoint.pinType || PinType.OTHER;
            var typeConfig = PIN_CONFIG[currentType] || {};

            voltageInput.value = existingPoint.voltage === '' ? '' : existingPoint.voltage;
            resistanceInput.value = existingPoint.resistance === '' ? '' : existingPoint.resistance;
            pinTypeInput.value = currentType;

            voltageInput.dataset.userModified = (voltageInput.value !== typeConfig.voltage) ? 'true' : 'false';
            resistanceInput.dataset.userModified = (resistanceInput.value !== typeConfig.resistance) ? 'true' : 'false';

            submitBtn.textContent = 'Save point';
        } else {
            voltageInput.value = '';
            resistanceInput.value = '';
            voltageInput.dataset.userModified = 'false';
            resistanceInput.dataset.userModified = 'false';

            var defaultType = Object.keys(PIN_CONFIG)[0] || PinType.OTHER;
            pinTypeInput.value = defaultType;

            submitBtn.textContent = 'Add point';
        }

        pinTypeInput.dispatchEvent(new Event('change'));

        dom.formEl.classList.remove('hidden');
        positionForm(clientX, clientY);
        voltageInput.focus();
    }

    function positionForm(clientX, clientY) {
        var formWidth = 230, formHeight = 240;
        var left = clientX + 12;
        var top = clientY + 12;
        if (left + formWidth > window.innerWidth) left = clientX - formWidth - 12;
        if (top + formHeight > window.innerHeight) top = clientY - formHeight - 12;
        dom.formEl.style.left = Math.max(8, left) + 'px';
        dom.formEl.style.top = Math.max(8, top) + 'px';
    }


    function reposition() {
        if (!state.pendingPoint) return; // form isn't open, nothing to do
        var side = state.pendingPoint.side;
        var rect = dom.overlays[side].getBoundingClientRect();
        var clientX = rect.left + state.pendingPoint.x * rect.width;
        var clientY = rect.top + state.pendingPoint.y * rect.height;
        positionForm(clientX, clientY);
    }

    function hideForm() {
        dom.formEl.classList.add('hidden');
        state.pendingPoint = null;
    }

    return {
        init: init,
        open: openForm,
        position: positionForm,
        reposition: reposition,
        hide: hideForm,
    };

})();