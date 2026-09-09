// qb-points.js
window.QB = window.QB || {};

QB.points = (function () {
    var state = QB.state;
    var dom = QB.dom;

    function render() {
        state.sides.forEach(function (side) {
            // Clean up DOM elements and detach references to prevent leaks
            dom.overlays[side].querySelectorAll('.point').forEach(function (el) {
                el.remove();
            });

            QB.util.positionsFor(side).forEach(function (pt) {
                var el = document.createElement('div');

                // Runtime-only references - never persisted (see exportReplacer)
                pt.el = el;
                pt.side = side;

                var isSelected = state.selectedPoint === pt;
                el.className = 'point pin-' + pt.pinType + (isSelected ? ' selected' : '');
                el.style.left = (pt.x * 100) + '%';
                el.style.top = (pt.y * 100) + '%';

                el.addEventListener('mousedown', onPointPressed(pt));
                el.addEventListener('mouseover', onPointHover(pt));
                el.addEventListener('mouseout', onPointLeave(pt));

                dom.overlays[side].appendChild(el);
            });
        });
    }

    // Concise Event Handlers
    const onPointPressed = pt => e => {
        e.stopPropagation();
        switch (state.mode) {
            case "select": QB.form.open(pt.side, pt.x, pt.y, e.clientX, e.clientY, pt); break;
            case "move":
                state.dragging = pt;
                pt.el?.classList.add('dragging');
                break;
            case "remove":
                remove(pt);
                break;
        }
    };

    const onPointHover = (pt, options = { scroll: true }) => () => {
        selectPoint(pt, options);
        if (state.mode === 'select') {
            showTooltipFor(pt);
        }
    };

    const onPointLeave = pt => e => {
        e.stopPropagation();
        hideTooltip();
        deselectPoint(pt);
    };

    function remove(pt) {
        if (!pt) return;
        var side = pt.side;

        // Clean references
        if (state.selectedPoint === pt) state.selectedPoint = null;
        if (state.dragging === pt) state.dragging = null;
        if (pt.el) {
            pt.el.remove();
            pt.el = null;
        }

        var list = QB.util.positionsFor(side);
        var idx = list.indexOf(pt);
        if (idx !== -1) list.splice(idx, 1);

        QB.storage.save(state.points);
        render();
        QB.table.render();
    }

    function selectPoint(pt, options = { scroll: true }) {
        if (!pt || state.selectedPoint === pt) return;

        if (state.selectedPoint)
            deselectPoint(state.selectedPoint);

        state.selectedPoint = pt;

        QB.table.highlightPointRow(pt);

        if (options.scroll)
            QB.table.scrollToPointRow(pt);
    }

    function deselectPoint(pt) {
        if (!pt) return;

        QB.table.deselectPointRow(pt);

        if (state.selectedPoint === pt) {
            state.selectedPoint = null;
            hideTooltip();
        }
    }

    // ---- Drag / Move ----

    function getMousePos(e, overlay) {
        if (!overlay) return null;

        var rect = overlay.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;

        return [
            Math.min(1, Math.max(0, x)),
            Math.min(1, Math.max(0, y))
        ];
    }

    function initDrag() {
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', onDragEnd);
    }

    function onDrag(e) {
        var pt = state.dragging;
        if (!pt || !pt.side) return;

        var overlay = dom.overlays[pt.side];
        var pos = getMousePos(e, overlay);
        if (!pos) return;

        pt.x = pos[0];
        pt.y = pos[1];

        if (pt.el) {
            pt.el.style.left = (pt.x * 100) + '%';
            pt.el.style.top = (pt.y * 100) + '%';
        }

        if (pt === state.selectedPoint) {
            positionTooltip(pt);
        }
    }

    function onDragEnd() {
        var pt = state.dragging;
        if (!pt) return;

        if (pt.el) pt.el.classList.remove('dragging');
        state.dragging = null;

        QB.storage.save(state.points);
    }

    // ---- Tooltip ----

    function showTooltipFor(pt) {
        if (!pt) { hideTooltip(); return; }

        var text = tooltipText(pt);
        if (!text) { hideTooltip(); return; }

        if (!state.tooltipEl) {
            state.tooltipEl = document.createElement('div');
            state.tooltipEl.className = 'point-tooltip';
            state.tooltipEl.style.pointerEvents = 'none';
        }

        positionTooltip(pt);
        state.tooltipEl.textContent = text;
        dom.overlays[pt.side].appendChild(state.tooltipEl);
        state.tooltipEl.style.background = '#000';
    }

    function tooltipText(pt) {
        if (pt.pinType === PinType.GROUND) return 'GND';
        if (pt.pinType === PinType.POWER_RAIL) return pt.voltage + 'v';
        return pt.resistance + 'Ω';
    }

    function positionTooltip(pt) {
        if (!state.tooltipEl || !pt) return;
        state.tooltipEl.style.left = (pt.x * 100) + '%';
        state.tooltipEl.style.top = (pt.y * 100) + '%';
    }

    function hideTooltip() {
        if (state.tooltipEl && state.tooltipEl.parentNode) {
            state.tooltipEl.parentNode.removeChild(state.tooltipEl);
        }
    }

    function init() {
        initDrag();

        state.sides.forEach(function (side) {
            dom.overlays[side].addEventListener('click', function (e) {
                if (state.mode === 'select' && e.target === dom.overlays[side]) {
                    if (state.selectedPoint) deselectPoint(state.selectedPoint);
                    render();
                    QB.table.render();
                }
            });
        });
    }

    return {
        init: init,
        render: render,
        remove: remove,
        select: selectPoint,
        onPointHover: onPointHover
    };
})();