// --- CONFIGURATION ---
const LERP_DOWN = 0.2;     // Speed when scrolling down (faster)
const LERP_UP = 0.02;    // Speed when scrolling up (slower/lazy)
const STREAMS_MIN_PADDING = 4; // Min padding to save Safari transparency
// ---------------------

const IPHONE_SIZES = {
    PRO_MAX: { w: 440, h: 956 },
    PRO: { w: 402, h: 874 },
    PLUS: { w: 430, h: 932 },
    STANDARD: { w: 393, h: 852 },
    SE: { w: 375, h: 667 }
};

// Safari Toolbar Height Constants (ScreenHeight - innerHeight)
// Based on iPhone Standard (852px total height)
const MODES = {
    COMPACT: 157, // Status Bar + Compact Bottom Bar
    BOTTOM: 217, // Status Bar + Full Bottom Address Bar
    TOP: 211  // Status Bar + Top Address Bar + Home Indicator
};

// Helper to get safe area insets via JS
function getSafeAreas() {
    const div = document.createElement('div');
    div.style.paddingTop = 'env(safe-area-inset-top, 0px)';
    div.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    div.style.position = 'fixed';
    div.style.visibility = 'hidden';
    document.body.appendChild(div);
    const style = window.getComputedStyle(div);
    const top = parseInt(style.paddingTop) || 0;
    const bottom = parseInt(style.paddingBottom) || 0;
    document.body.removeChild(div);
    return { top, bottom };
}

let isCalculated = false;
let lastWidth = 0;
let stableHeight = 0;
let lastScrollY = 0;

// Lerp state
let navOpacity = 1;
let streamsPadding = 52;

function detectMode(totalBars, safe) {
    const minBars = safe.top + safe.bottom;
    if (Math.abs(totalBars - minBars) < 10) return "HIDDEN / SCROLLED";
    if (Math.abs(totalBars - MODES.COMPACT) < 5) return "COMPACT";
    if (Math.abs(totalBars - MODES.BOTTOM) < 5) return "BOTTOM";
    if (Math.abs(totalBars - MODES.TOP) < 5) return "TOP";
    return "UNKNOWN";
}

function initLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const safe = getSafeAreas();

    let refH = 0;
    for (const k in IPHONE_SIZES) if (IPHONE_SIZES[k].w === w) refH = IPHONE_SIZES[k].h;
    if (!refH) return;

    const totalBars = refH - h;
    const minBars = safe.top + safe.bottom;
    const maxGain = Math.max(0, totalBars - minBars);

    document.body.style.minHeight = (h + maxGain + 1) + 'px';
    stableHeight = h;
    isCalculated = true;
    lastWidth = w;

    updateReactiveUI();
}

function updateReactiveUI() {
    if (!isCalculated) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const safe = getSafeAreas();

    let refH = 0;
    for (const k in IPHONE_SIZES) if (IPHONE_SIZES[k].w === w) refH = IPHONE_SIZES[k].h;
    if (!refH) return;

    const totalBars = refH - h;
    const mode = detectMode(totalBars, safe);
    const minBars = safe.top + safe.bottom;
    const currentGain = Math.max(0, h - stableHeight);

    // Targets based on scroll (2x slower: divide by 100 instead of 50)
    const scrollY = window.scrollY;
    const direction = scrollY > lastScrollY ? 'down' : 'up';

    const targetOpacity = Math.max(0, 1 - (scrollY / 100));
    const targetPadding = Math.max(STREAMS_MIN_PADDING, 52 - (scrollY / 1.5));

    // Damping factors
    const factor = direction === 'down' ? LERP_DOWN : LERP_UP;

    navOpacity += (targetOpacity - navOpacity) * factor;
    streamsPadding += (targetPadding - streamsPadding) * factor;

    document.documentElement.style.setProperty('--safari-gain-dynamic', currentGain + 'px');
    document.documentElement.style.setProperty('--nav-opacity', navOpacity);
    document.documentElement.style.setProperty('--streams-padding-top', streamsPadding + 'px');

    lastScrollY = scrollY;
    updateDebugDisplay(mode, totalBars, minBars, w, h, safe, currentGain, navOpacity, streamsPadding, direction);
}

function updateDebugDisplay(mode, totalBars, minBars, w, h, safe, gain, navO, streamsP, dir) {
    let info = document.getElementById('debug-info');
    if (!info) {
        info = document.createElement('div');
        info.id = 'debug-info';
        info.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.85); color: #00ff00; padding: 15px; border-radius: 12px; font-family: monospace; font-size: 11px; z-index: 9999; pointer-events: none; border: 1px solid #333; line-height: 1.5; text-align: left; min-width: 200px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);";
        document.body.appendChild(info);
    }

    const vv = window.visualViewport;
    info.innerHTML = `
            <b style="color: #fff; border-bottom: 1px solid #444; display: block; margin-bottom: 5px; padding-bottom: 3px;">SAFARI DYNAMICS (DAMPED)</b>
            State: <span style="color: #609DFF">${mode}</span><br>
            Current Bars: ${totalBars}px | Dir: ${dir}<br>
            Hidden Bars: ${minBars}px<br>
            <hr style="border: 0; border-top: 1px solid #333; margin: 5px 0;">
            Window: ${w} x ${h}<br>
            Nav Opacity: ${navO.toFixed(2)}<br>
            Streams Pad: ${streamsP.toFixed(0)}px (min ${STREAMS_MIN_PADDING})<br>
            Gain Dynamic: +${gain}px<br>
            ${vv ? `Visual: ${vv.width.toFixed(0)} x ${vv.height.toFixed(0)}` : 'Visual: N/A'}
        `;
}

const animate = () => {
    updateReactiveUI();
    requestAnimationFrame(animate);
};

window.addEventListener('resize', () => {
    const w = window.innerWidth;
    if (Math.abs(w - lastWidth) > 10) { isCalculated = false; initLayout(); }
});

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initLayout); } else { initLayout(); }
setTimeout(initLayout, 500);
requestAnimationFrame(animate);
