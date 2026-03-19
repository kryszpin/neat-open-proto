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

    function updateDebug() {
        let info = document.getElementById('debug-info');
        if (!info) {
            info = document.createElement('div');
            info.id = 'debug-info';
            // Centered position to avoid overlapping Top Bar or Safari toolbar
            info.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.85); color: #00ff00; padding: 15px; border-radius: 12px; font-family: monospace; font-size: 11px; z-index: 9999; pointer-events: none; border: 1px solid #333; line-height: 1.5; text-align: left; min-width: 160px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);";
            document.body.appendChild(info);
        }
        
        const vv = window.visualViewport;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const dw = document.documentElement.clientWidth;
        const dh = document.documentElement.clientHeight;

        info.innerHTML = `
            <b style="color: #fff; border-bottom: 1px solid #444; display: block; margin-bottom: 5px; padding-bottom: 3px;">SAFARI DEBUG</b>
            Window: ${w} x ${h}<br>
            Doc: ${dw} x ${dh}<br>
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
