(function() {
    // iPhone Screen Size Reference (Width x Height in CSS pixels)
    // These are base reference sizes for common models
    const IPHONE_SIZES = {
        PRO_MAX:  { w: 440, h: 956 },
        PRO:      { w: 402, h: 874 },
        PLUS:     { w: 430, h: 932 },
        STANDARD: { w: 393, h: 852 },
        SE:       { w: 375, h: 667 }
    };

    // Safari Toolbar Height Constants (ScreenHeight - innerHeight)
    // Based on iPhone Standard (852px total height)
    const MODES = {
        COMPACT: 157, // Status Bar + Compact Bottom Bar
        BOTTOM:  217, // Status Bar + Full Bottom Address Bar
        TOP:     211  // Status Bar + Top Address Bar + Home Indicator
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

    function detectMode(totalBars, safe) {
        const minBars = safe.top + safe.bottom;
        if (Math.abs(totalBars - minBars) < 10) return "HIDDEN / SCROLLED";
        if (Math.abs(totalBars - MODES.COMPACT) < 5) return "COMPACT";
        if (Math.abs(totalBars - MODES.BOTTOM) < 5) return "BOTTOM";
        if (Math.abs(totalBars - MODES.TOP) < 5) return "TOP";
        return "TRANSITIONING...";
    }

    function updateLayout(force = false) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // Only recalculate on init or major resize (e.g. rotation)
        if (!force && isCalculated && Math.abs(w - lastWidth) < 10) return;
        
        const safe = getSafeAreas();
        
        // Find reference height for current width
        let refH = 0;
        for (const k in IPHONE_SIZES) {
            if (IPHONE_SIZES[k].w === w) {
                refH = IPHONE_SIZES[k].h;
                break;
            }
        }

        if (!refH) return;

        const totalBars = refH - h;
        const mode = detectMode(totalBars, safe);
        const minBars = safe.top + safe.bottom;
        const gain = Math.max(0, totalBars - minBars);

        // LOCK the height once detected at start
        const optimalHeight = h + gain + 1; 
        document.body.style.minHeight = optimalHeight + 'px';
        document.documentElement.style.setProperty('--safari-gain', gain + 'px');
        
        isCalculated = true;
        lastWidth = w;
        
        updateDebugDisplay(mode, totalBars, minBars, w, h, safe, gain);
    }

    function updateDebugDisplay(mode, totalBars, minBars, w, h, safe, gain) {
        let info = document.getElementById('debug-info');
        if (!info) {
            info = document.createElement('div');
            info.id = 'debug-info';
            info.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.85); color: #00ff00; padding: 15px; border-radius: 12px; font-family: monospace; font-size: 11px; z-index: 9999; pointer-events: none; border: 1px solid #333; line-height: 1.5; text-align: left; min-width: 200px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);";
            document.body.appendChild(info);
        }
        
        const vv = window.visualViewport;
        info.innerHTML = `
            <b style="color: #fff; border-bottom: 1px solid #444; display: block; margin-bottom: 5px; padding-bottom: 3px;">SAFARI DYNAMICS</b>
            State: <span style="color: #609DFF">${mode}</span><br>
            Current Bars: ${totalBars}px<br>
            Hidden Bars: ${minBars}px<br>
            <hr style="border: 0; border-top: 1px solid #333; margin: 5px 0;">
            Window: ${w} x ${h}<br>
            Safe Area: T:${safe.top} B:${safe.bottom}<br>
            Pixels Gained: +${gain}px<br>
            ${vv ? `Visual: ${vv.width.toFixed(0)} x ${vv.height.toFixed(0)}<br>Offset: ${vv.offsetLeft.toFixed(0)}, ${vv.offsetTop.toFixed(0)}` : 'Visual: N/A'}
        `;
    }

    window.addEventListener('resize', () => {
        // Debounce resize to handle rotation smoothly
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => updateLayout(), 200);
    });
    
    // Only update debug info on scroll, not layout
    window.addEventListener('scroll', () => {
        // We could call updateDebugDisplay here if refH is available, 
        // but for stability let's stick to interval/init
    });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updateLayout(true));
    } else {
        updateLayout(true);
    }
    
    // Catch Safari's final layout settle
    setTimeout(() => updateLayout(true), 500);
    
    setInterval(() => {
        const safe = getSafeAreas();
        const w = window.innerWidth;
        const h = window.innerHeight;
        let refH = 0;
        for (const k in IPHONE_SIZES) if (IPHONE_SIZES[k].w === w) refH = IPHONE_SIZES[k].h;
        if (refH) {
            const totalBars = refH - h;
            const mode = detectMode(totalBars, safe);
            const minBars = safe.top + safe.bottom;
            const gain = Math.max(0, totalBars - minBars);
            updateDebugDisplay(mode, totalBars, minBars, w, h, safe, gain);
        }
    }, 1000);
})();
