// Coinglass Liquidation Heatmap copy helper
// Click a heatmap zone to copy the hovered Price value.

(function () {
    if (!window.location.href.includes('/pro/futures/LiquidationHeatMap')) return;

    var TOAST_ID = 'coinglass-copy-toast';

    function isSpanishPage() {
        return window.location.pathname.startsWith('/es/');
    }

    function getI18n() {
        if (isSpanishPage()) {
            return {
                loaded: 'Herramienta Heatmap activa: clic en una zona para copiar Precio',
                copied: 'Copiado: ',
                copyFailed: 'No se pudo copiar'
            };
        }

        return {
            loaded: 'Heatmap tool active: click a zone to copy Price',
            copied: 'Copied: ',
            copyFailed: 'Copy failed'
        };
    }

    function isVisible(el) {
        if (!el) return false;
        var rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        var style = window.getComputedStyle(el);
        return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
    }

    function normalizePrice(raw) {
        if (!raw) return null;

        var cleaned = raw
            .replace(/[\u00A0\u202F\s']/g, '')
            .replace(/[^0-9,\.]/g, '');

        if (!cleaned) return null;

        var lastDot = cleaned.lastIndexOf('.');
        var lastComma = cleaned.lastIndexOf(',');

        // If both separators exist, the rightmost one is decimal separator.
        if (lastDot !== -1 && lastComma !== -1) {
            if (lastDot > lastComma) {
                cleaned = cleaned.replace(/,/g, '');
            } else {
                cleaned = cleaned.replace(/\./g, '');
                cleaned = cleaned.replace(',', '.');
            }
            return cleaned;
        }

        // Only comma present: decide if decimal or thousand separator.
        if (lastComma !== -1) {
            var commaParts = cleaned.split(',');
            if (commaParts.length === 2 && commaParts[1].length <= 2) {
                return cleaned.replace(',', '.');
            }
            return cleaned.replace(/,/g, '');
        }

        // Only dot present: if multiple dots, treat as thousands separators except last.
        var dotParts = cleaned.split('.');
        if (dotParts.length > 2) {
            var decimal = dotParts.pop();
            cleaned = dotParts.join('') + '.' + decimal;
        }

        return cleaned;
    }

    function extractPriceFromText(text) {
        if (!text) return null;
        var match = text.match(/(?:Price|Precio)\s*[:\-]?\s*([0-9][0-9.,\u00A0\u202F\s']*)/i);
        if (!match) return null;
        return normalizePrice(match[1]);
    }

    function collectCandidateTexts(x, y) {
        var texts = [];
        var seen = new Set();

        function pushText(el) {
            if (!el || seen.has(el)) return;
            seen.add(el);
            if (!isVisible(el)) return;
            var txt = (el.innerText || el.textContent || '').trim();
            if (!txt) return;
            if (txt.length > 500) return;
            texts.push(txt);
        }

        var pointEls = document.elementsFromPoint(x, y);
        for (var i = 0; i < pointEls.length; i++) {
            var el = pointEls[i];
            pushText(el);
            var children = el.querySelectorAll('div,span,p');
            for (var j = 0; j < children.length; j++) {
                pushText(children[j]);
            }
        }

        var tooltipEls = document.querySelectorAll('[role="tooltip"], [class*="tooltip"], [class*="Tooltip"]');
        for (var k = 0; k < tooltipEls.length; k++) {
            pushText(tooltipEls[k]);
        }

        return texts;
    }

    function findPriceAtPoint(x, y) {
        var texts = collectCandidateTexts(x, y);
        for (var i = 0; i < texts.length; i++) {
            var price = extractPriceFromText(texts[i]);
            if (price) return price;
        }
        return null;
    }

    function showToast(message) {
        var existing = document.getElementById(TOAST_ID);
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.id = TOAST_ID;
        toast.textContent = message;
        toast.style.cssText = [
            'position:fixed',
            'top:16px',
            'left:50%',
            'transform:translateX(-50%)',
            'background:rgba(12,18,30,0.95)',
            'color:#ffffff',
            'padding:10px 14px',
            'border-radius:8px',
            'font-size:13px',
            'font-weight:600',
            'font-family:Segoe UI, Arial, sans-serif',
            'z-index:2147483647',
            'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
            'border:1px solid rgba(255,255,255,0.15)'
        ].join(';');

        document.body.appendChild(toast);
        window.setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 1700);
    }

    function showLoadedMessage() {
        var t = getI18n();
        showToast(t.loaded);
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }

        return new Promise(function (resolve, reject) {
            try {
                var input = document.createElement('textarea');
                input.value = text;
                input.style.position = 'fixed';
                input.style.opacity = '0';
                document.body.appendChild(input);
                input.focus();
                input.select();
                var ok = document.execCommand('copy');
                input.remove();
                if (ok) resolve(); else reject(new Error('copy failed'));
            } catch (err) {
                reject(err);
            }
        });
    }

    document.addEventListener('click', function (event) {
        if (event.button !== 0) return;

        var price = findPriceAtPoint(event.clientX, event.clientY);
        if (!price) return;
        var t = getI18n();

        copyText(price)
            .then(function () {
                chrome.storage.local.set({ coinglassCopiedPrice: { value: price, ts: Date.now() } });
                showToast(t.copied + price);
            })
            .catch(function () {
                showToast(t.copyFailed);
            });
    }, true);

    // Aviso inicial de usabilidad para confirmar que el script cargo.
    window.setTimeout(showLoadedMessage, 350);
})();
