// --- CONFIGURATION ---
const STREAMS_MIN_PADDING = 6; // Min padding to save Safari transparency
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
let debugVisible = false;

// Current state (1:1 with scroll now)
let navOpacity = 1;
let streamsPadding = 52;
let controlsOpacity = 1;

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

    // Toggle Debug UI
    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
        infoBtn.onclick = () => {
            debugVisible = !debugVisible;
            const info = document.getElementById('debug-info');
            if (info) info.style.display = debugVisible ? 'block' : 'none';
        };
    }

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

    // Targets based on scroll
    const scrollY = window.scrollY;
    const direction = scrollY > lastScrollY ? 'down' : 'up';

    // 1:1 Scroll Responsiveness (removed damping)
    navOpacity = Math.max(0, 1 - (scrollY / 100));
    streamsPadding = Math.max(STREAMS_MIN_PADDING, 52 - (scrollY / 1.5));
    controlsOpacity = Math.max(0, 1 - (scrollY / 80));

    document.documentElement.style.setProperty('--safari-gain-dynamic', currentGain + 'px');
    document.documentElement.style.setProperty('--nav-opacity', navOpacity);
    document.documentElement.style.setProperty('--streams-padding-top', streamsPadding + 'px');
    document.documentElement.style.setProperty('--controls-opacity', controlsOpacity);
    
    // Handle physical visibility to clear space after fade-out
    const controlsEl = document.querySelector('.controls-area');
    if (controlsEl) {
        controlsEl.style.visibility = (controlsOpacity < 0.01) ? 'hidden' : 'visible';
        controlsEl.style.pointerEvents = (controlsOpacity < 0.1) ? 'none' : 'auto';
    }

    // --- SANDWICH VIDEO AREA LOGIC ---
    let vHeight = 0;
    const videoEl = document.getElementById('main-video-area');
    const streamsEl = document.querySelector('.streams-section');
    if (videoEl && streamsEl) {
        // Use Actual rendered bottom of streams for top boundary (0px gap)
        const sRect = streamsEl.getBoundingClientRect();
        const vTop = sRect.bottom;
        
        // Bottom Boundary: Controls Top (if visible) or Safari Edge
        let vBottom = h - safe.bottom;
        if (controlsEl && controlsOpacity > 0.1) {
            const rect = controlsEl.getBoundingClientRect();
            vBottom = rect.top;
        }

        vHeight = Math.max(0, vBottom - vTop);
        videoEl.style.top = vTop + 'px';
        videoEl.style.height = vHeight + 'px';
    }

    lastScrollY = scrollY;
    updateDebugDisplay(mode, totalBars, minBars, w, h, safe, currentGain, navOpacity, streamsPadding, controlsOpacity, direction, vHeight);
}

function updateDebugDisplay(mode, totalBars, minBars, w, h, safe, gain, navO, streamsP, controlsO, dir, videoH) {
    let info = document.getElementById('debug-info');
    if (!info) {
        info = document.createElement('div');
        info.id = 'debug-info';
        info.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.85); color: #00ff00; padding: 15px; border-radius: 12px; font-family: monospace; font-size: 11px; z-index: 9999; pointer-events: none; border: 1px solid #333; line-height: 1.5; text-align: left; min-width: 200px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: none;";
        document.body.appendChild(info);
    }

    const vv = window.visualViewport;
    info.innerHTML = `
            <b style="color: #fff; border-bottom: 1px solid #444; display: block; margin-bottom: 5px; padding-bottom: 3px;">SAFARI DYNAMICS (DYNAMIC)</b>
            State: <span style="color: #609DFF">${mode}</span><br>
            Current Bars: ${totalBars}px | Dir: ${dir}<br>
            <hr style="border: 0; border-top: 1px solid #333; margin: 5px 0;">
            Nav Opacity: ${navO.toFixed(2)}<br>
            Streams Pad: ${streamsP.toFixed(0)}px<br>
            Ctrl Opacity: ${controlsO.toFixed(2)} | VidH: ${videoH.toFixed(0)}<br>
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
