// Función para extraer el valor numérico de un texto (ej: "$12.02B" -> 12020000000)
function parseValue(text) {
    if (!text) return 0;

    // Eliminar $, espacios y comas
    let cleaned = text.replace(/[$,\s]/g, '');

    // Convertir B (billones), M (millones) y K (miles) a números
    let multiplier = 1;
    if (cleaned.includes('B')) {
        multiplier = 1000000000;
        cleaned = cleaned.replace('B', '');
    } else if (cleaned.includes('M')) {
        multiplier = 1000000;
        cleaned = cleaned.replace('M', '');
    } else if (cleaned.includes('K')) {
        multiplier = 1000;
        cleaned = cleaned.replace('K', '');
    }

    return parseFloat(cleaned) * multiplier;
}

// Función para formatear el número con B, M o K
function formatValue(value) {
    const absValue = Math.abs(value);

    if (absValue >= 1000000000) {
        return (value / 1000000000).toFixed(2) + 'B';
    } else if (absValue >= 1000000) {
        return (value / 1000000).toFixed(2) + 'M';
    } else if (absValue >= 1000) {
        return (value / 1000).toFixed(2) + 'K';
    }
    return value.toFixed(2);
}

// Variable para evitar actualizaciones excesivas
let isUpdating = false;
let lastValues = { long: 0, short: 0 };

// Función para buscar valores en los divs con clase "Number"
function findVolumeValues() {
    let longVolume = 0;
    let shortVolume = 0;

    // Buscar todos los divs que contienen números con clases específicas
    const numberDivs = document.querySelectorAll('div.Number');

    numberDivs.forEach(div => {
        const text = div.textContent.trim();
        // Buscar valores que contengan $ y tengan formato de moneda
        if (text.startsWith('$') && (text.includes('M') || text.includes('B') || text.includes('K'))) {
            const value = parseValue(text);

            // Determinar si es Long o Short por el color
            const style = div.getAttribute('class');
            const computedStyle = window.getComputedStyle(div);
            const color = computedStyle.color;

            // Verde para Long (rise-color), Rojo para Short (fall-color)
            if (div.classList.contains('rise-color') || color.includes('rgb(22, 199, 132)')) {
                if (value > longVolume) longVolume = value;
            } else if (div.classList.contains('fall-color') || color.includes('rgb(234, 57, 67)')) {
                if (value > shortVolume) shortVolume = value;
            }
        }
    });

    // Si no encontramos por clase, buscar por posición en el DOM
    if (longVolume === 0 || shortVolume === 0) {
        const allDivs = document.querySelectorAll('div');
        let foundLong = false;

        allDivs.forEach(div => {
            const text = div.textContent;

            if (text.includes('Long') && text.includes('$') && (text.includes('M') || text.includes('B'))) {
                const match = text.match(/\$[\d.]+[BMK]/);
                if (match && !foundLong) {
                    longVolume = parseValue(match[0]);
                    foundLong = true;
                }
            }

            if (text.includes('Short') && text.includes('$') && (text.includes('M') || text.includes('B'))) {
                const match = text.match(/\$[\d.]+[BMK]/);
                if (match) {
                    shortVolume = parseValue(match[0]);
                }
            }
        });
    }

    return { longVolume, shortVolume };
}

// Función para calcular y mostrar el delta
function calculateAndDisplayDelta() {
    if (isUpdating) return;
    isUpdating = true;

    try {
        const { longVolume, shortVolume } = findVolumeValues();

        // Solo actualizar si encontramos valores válidos
        if (longVolume > 0 && shortVolume > 0) {
            // Verificar si los valores cambiaron
            if (longVolume !== lastValues.long || shortVolume !== lastValues.short) {
                console.log('Valores actualizados - Long:', formatValue(longVolume), 'Short:', formatValue(shortVolume));

                lastValues = { long: longVolume, short: shortVolume };

                const delta = longVolume - shortVolume;
                const percentage = shortVolume > 0 ? ((delta / shortVolume) * 100) : 0;

                updateDeltaDisplay(delta, percentage, longVolume, shortVolume);
            }
        }
    } catch (error) {
        console.error('Error en calculateAndDisplayDelta:', error);
    } finally {
        isUpdating = false;
    }
}

// Función para actualizar o crear la visualización del Delta
function updateDeltaDisplay(delta, percentage, longVolume, shortVolume) {
    let deltaContainer = document.getElementById('coinglass-delta-display');

    if (!deltaContainer) {
        deltaContainer = document.createElement('div');
        deltaContainer.id = 'coinglass-delta-display';
        deltaContainer.style.cssText = `
      position: fixed;
      top: 120px;
      left: 20px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 240px;
      backdrop-filter: blur(10px);
    `;
        document.body.appendChild(deltaContainer);
    }

    const color = delta >= 0 ? '#16c784' : '#ea3943';
    const sign = delta >= 0 ? '+' : '';
    const arrow = delta >= 0 ? '▲' : '▼';

    deltaContainer.innerHTML = `
    <div style="font-size: 12px; color: #64748b; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
      Delta (Long - Short)
    </div>
    <div style="font-size: 28px; color: ${color}; font-weight: bold; margin-bottom: 8px;">
      ${sign}$${formatValue(delta)}
    </div>
    <div style="font-size: 18px; color: ${color}; font-weight: 600; margin-bottom: 16px;">
      ${arrow} ${sign}${percentage.toFixed(2)}%
    </div>
    <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 12px; color: #64748b;">Long Volume:</span>
        <span style="font-size: 12px; color: #16c784; font-weight: 600;">$${formatValue(longVolume)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-size: 12px; color: #64748b;">Short Volume:</span>
        <span style="font-size: 12px; color: #ea3943; font-weight: 600;">$${formatValue(shortVolume)}</span>
      </div>
    </div>
    <div style="font-size: 10px; color: #94a3b8; margin-top: 12px; text-align: center;">
      ${new Date().toLocaleTimeString()}
    </div>
  `;
}

// Función principal de inicialización
function initialize() {
    console.log('Coinglass Delta Extension: Iniciando...');

    // Primera actualización
    setTimeout(() => {
        calculateAndDisplayDelta();
    }, 1500);

    // Actualizar cada 3 segundos
    setInterval(() => {
        calculateAndDisplayDelta();
    }, 3000);
}

// Observar cambios en elementos específicos
const observer = new MutationObserver(() => {
    setTimeout(calculateAndDisplayDelta, 500);
});

// Esperar a que la página cargue
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initialize();
        // Observar cambios en el contenedor principal
        const mainContainer = document.querySelector('body');
        if (mainContainer) {
            observer.observe(mainContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        }
    });
} else {
    initialize();
    const mainContainer = document.querySelector('body');
    if (mainContainer) {
        observer.observe(mainContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }
}

console.log('Coinglass Delta Extension: Script cargado');