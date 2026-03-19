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

    function detectMode(totalBars) {
        if (Math.abs(totalBars - MODES.COMPACT) < 5) return "COMPACT";
        if (Math.abs(totalBars - MODES.BOTTOM) < 5) return "BOTTOM";
        if (Math.abs(totalBars - MODES.TOP) < 5) return "TOP";
        return "UNKNOWN / SCROLLED";
    }

    function updateDebug() {
        let info = document.getElementById('debug-info');
        if (!info) {
            info = document.createElement('div');
            info.id = 'debug-info';
            info.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.85); color: #00ff00; padding: 15px; border-radius: 12px; font-family: monospace; font-size: 11px; z-index: 9999; pointer-events: none; border: 1px solid #333; line-height: 1.5; text-align: left; min-width: 200px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);";
            document.body.appendChild(info);
        }
        
        const safe = getSafeAreas();
        const vv = window.visualViewport;
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // Find reference height for current width
        let refH = 0;
        for (const k in IPHONE_SIZES) {
            if (IPHONE_SIZES[k].w === w) {
                refH = IPHONE_SIZES[k].h;
                break;
            }
        }

        const totalBars = refH ? (refH - h) : 0;
        const mode = detectMode(totalBars);

        info.innerHTML = `
            <b style="color: #fff; border-bottom: 1px solid #444; display: block; margin-bottom: 5px; padding-bottom: 3px;">SAFARI DEBUG</b>
            Mode: <span style="color: #609DFF">${mode}</span><br>
            Total Bar H: ${totalBars}px<br>
            <hr style="border: 0; border-top: 1px solid #333; margin: 5px 0;">
            Window: ${w} x ${h}<br>
            Safe Area: T:${safe.top} B:${safe.bottom}<br>
            ${vv ? `Visual: ${vv.width.toFixed(0)} x ${vv.height.toFixed(0)}<br>Offset: ${vv.offsetLeft.toFixed(0)}, ${vv.offsetTop.toFixed(0)}` : 'Visual: N/A'}<br>
            DPR: ${window.devicePixelRatio}
        `;
    }

    window.addEventListener('resize', updateDebug);
    window.addEventListener('scroll', updateDebug);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateDebug);
        window.visualViewport.addEventListener('scroll', updateDebug);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateDebug);
    } else {
        updateDebug();
    }
    
    // Periodic update to catch Safari UI changes that don't trigger resize immediately
    setInterval(updateDebug, 1000);
})();
