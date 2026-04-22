// TradingView Delta Display

function formatValueTV(v) {
    var a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (v / 1e3).toFixed(2) + 'K';
    return v.toFixed(2);
}

function findToolbar() {
    return document.querySelector('[role="toolbar"][class*="toolbar-"]');
}

function injectDeltaElement() {
    if (document.getElementById('tv-coinglass-delta')) return true;
    var t = findToolbar();
    if (!t) return false;
    var el = document.createElement('div');
    el.id = 'tv-coinglass-delta';
    el.style.cssText = 'display:inline-flex;align-items:center;padding:0 10px;height:100%;border-radius:4px;font-size:12px;font-weight:700;font-family:sans-serif;cursor:default;white-space:nowrap;color:#888;background:transparent;border:1px solid rgba(128,128,128,0.4);margin-left:310px;vertical-align:middle';
    el.textContent = 'Δ --';
    el.title = 'Delta Coinglass. Abre coinglass.com/LongShortRatio para actualizar';
    t.appendChild(el);
    return true;
}

function updateTVDelta() {
    chrome.storage.local.get(['coinglassDelta'], function (r) {
        if (chrome.runtime.lastError) return;
        injectDeltaElement();
        var el = document.getElementById('tv-coinglass-delta');
        if (!el) return;
        var d = r.coinglassDelta;
        if (!d || typeof d.delta !== 'number') {
            el.textContent = 'Δ Sin datos';
            el.style.color = '#888';
            el.style.background = 'transparent';
            el.style.border = '1px solid rgba(128,128,128,0.4)';
            return;
        }
        var pos = d.delta >= 0;
        el.style.color = pos ? '#16c784' : '#ea3943';
        el.style.background = pos ? 'rgba(22,199,132,0.12)' : 'rgba(234,57,67,0.12)';
        el.style.border = '1px solid ' + (pos ? 'rgba(22,199,132,0.5)' : 'rgba(234,57,67,0.5)');
        var sign = pos ? '+' : '';
        var age = Math.round((Date.now() - d.timestamp) / 1000);
        var ageStr = age < 60 ? age + 's' : Math.round(age / 60) + 'm';
        el.textContent = 'Δ ' + sign + '$' + formatValueTV(d.delta) + ' (' + sign + d.percentage.toFixed(2) + '%)';
        el.title = 'Delta Coinglass\nLong: $' + formatValueTV(d.longVolume) + ' | Short: $' + formatValueTV(d.shortVolume) + '\nHace: ' + ageStr;
    });
}

var tvObs = new MutationObserver(function () {
    if (!document.getElementById('tv-coinglass-delta')) {
        if (injectDeltaElement()) { updateTVDelta(); tvObs.disconnect(); }
    }
});

// Actualizacion casi en tiempo real cuando Coinglass escribe en storage.
chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== 'local') return;
    if (!changes.coinglassDelta) return;
    updateTVDelta();
});

function init() {
    if (!injectDeltaElement()) { tvObs.observe(document.body, { childList: true, subtree: true }); }
    updateTVDelta();
    // Fallback por si el evento onChanged no llega en algun navegador/estado.
    setInterval(updateTVDelta, 1000);
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
else { init(); }