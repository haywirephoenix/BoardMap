window.QB = window.QB || {};

const PinType = {
    GROUND: 'GROUND',
    LOW_RESISTANCE: 'LOW_RESISTANCE',
    MEDIUM_RESISTANCE: 'MEDIUM_RESISTANCE',
    HIGH_IMPEDANCE: 'HIGH_IMPEDANCE',
    FLOATING: 'FLOATING',
    CAPACITIVE_BOUNDED: 'CAPACITIVE_BOUNDED', // Climbs then holds (e.g. 541k)
    CAPACITIVE_OPEN: 'CAPACITIVE_OPEN',       // Climbs to 20M+ then goes 0L
    OPEN_CIRCUIT: 'OPEN_CIRCUIT',
    POWER_RAIL: 'POWER_RAIL',
    EDL_CANDIDATE: 'EDL_CANDIDATE',
    EDL_CONFIRMED: 'EDL_CONFIRMED',
    OTHER: 'OTHER'
};

const pinDef = (label, color, voltage = '', resistance = '') => ({ label, color, voltage, resistance });

const PIN_CONFIG = {
    [PinType.GROUND]:             pinDef('GND',                    '#0066ff', '', '0 Ω'),
    [PinType.POWER_RAIL]:         pinDef('1.8V Power',             '#00cc44', '1.8V'),
    [PinType.EDL_CANDIDATE]:      pinDef('EDL Candidate',          '#ff00ff', '', 'High (MΩ)'),
    [PinType.EDL_CONFIRMED]:      pinDef('EDL Confirmed',          '#ff0000', '', '0'),
    [PinType.HIGH_IMPEDANCE]:     pinDef('High Imp (MΩ)',          '#9900cc', '', 'M'),
    [PinType.FLOATING]:           pinDef('Floating (Cap Charging)','#1abc9c', '', 'Climbing (MΩ)'),
    [PinType.CAPACITIVE_BOUNDED]: pinDef('Cap Float (Settles)',    '#1abc9c', '', 'Climbs & Settles (MΩ)'),
    [PinType.CAPACITIVE_OPEN]:    pinDef('Cap Float (Open 0L)',    '#ffe100', '', 'Climbs to 0L'),
    [PinType.MEDIUM_RESISTANCE]:  pinDef('Med Res (kΩ)',           '#e67e22', '', 'k'),
    [PinType.LOW_RESISTANCE]:     pinDef('Low Res (Ω)',            '#ff9900', '', 'Low (Ω)'),
    [PinType.OPEN_CIRCUIT]:       pinDef('Open (0L)',              '#777777', '', '0L'),
    [PinType.OTHER]:              pinDef('Other',                  '#333333')
};

function getPinColor(pinType) {
    return PIN_CONFIG[pinType]?.color || '#ffffff';
}

// QB.pins = (function () {
//     return {
//         init: init
//     };
// })();