window.QB = window.QB || {};

// WCAG 2.1 sRGB Relative Luminance Constants
const SRGB_CUTOFF = 0.03928;
const SRGB_LOW_SCALE = 12.92;
const SRGB_OFFSET = 0.055;
const SRGB_DIVISOR = 1.055;
const SRGB_GAMMA = 2.4;

// Luma weights based on Rec. 709 / WCAG 2.1
const RED_COEFFICIENT = 0.2126;
const GREEN_COEFFICIENT = 0.7152;
const BLUE_COEFFICIENT = 0.0722;

/**
 * WCAG AA standard threshold for black text vs white text (Contrast Ratio >= 4.5:1).
 * Relative luminance of background must be >= ~0.179 to maintain 4.5:1 ratio with black.
 */
const WCAG_AA_LUMINANCE_THRESHOLD = 0.179;

/**
 * Normalizes an sRGB channel value to linear RGB.
 * @param {number} 8bitVal - Channel value (0-255)
 * @returns {number} Linear channel value (0.0-1.0)
 */
function normalizeChannel(bitVal) {
    const srgb = bitVal / 255.0;
    return srgb <= SRGB_CUTOFF
        ? srgb / SRGB_LOW_SCALE
        : Math.pow((srgb + SRGB_OFFSET) / SRGB_DIVISOR, SRGB_GAMMA);
}

/**
 * Converts standard 3 or 6 digit hex string to RGB values.
 * Handles both `#FFF` and `#FFFFFF` formats.
 * @param {string} hex 
 * @returns {{r: number, g: number, b: number} | null}
 */
function hexToRgb(hex) {
    if (typeof hex !== 'string') return null;

    let cleanHex = hex.trim().replace(/^#/, '');

    // Expand shorthand hex format (e.g. "03F") to full format ("0033FF")
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(char => char + char).join('');
    }

    if (cleanHex.length !== 6) return null;

    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return null;

    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

/**
 * Calculates relative luminance (0.0 to 1.0) per WCAG 2.1 specs.
 * @param {string} backgroundColor - Hex color code
 * @returns {number}
 */
function computeLuminance(backgroundColor) {
    const rgb = hexToRgb(backgroundColor);
    if (!rgb) {
        throw new Error(`Invalid hex color string provided: "${backgroundColor}"`);
    }

    const rLinear = normalizeChannel(rgb.r);
    const gLinear = normalizeChannel(rgb.g);
    const bLinear = normalizeChannel(rgb.b);

    return (RED_COEFFICIENT * rLinear) + (GREEN_COEFFICIENT * gLinear) + (BLUE_COEFFICIENT * bLinear);
}

/**
 * Determines whether text should be black for high contrast against a background color.
 * @param {string} backgroundColor - Hex string
 * @param {number} [threshold=WCAG_AA_LUMINANCE_THRESHOLD]
 * @returns {boolean}
 */
function shouldTextBeBlack(backgroundColor, threshold = WCAG_AA_LUMINANCE_THRESHOLD) {
    return computeLuminance(backgroundColor) >= threshold;
}