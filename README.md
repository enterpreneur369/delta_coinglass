# Delta Coinglass Extension

Extension para Edge/Chrome que conecta datos de Coinglass con tu flujo en TradingView.

## Funcionalidades

1. Delta Long/Short en Coinglass.
2. Delta visible en TradingView (barra inferior), con color por direccion.
3. Sincronizacion casi en tiempo real entre pestañas usando `chrome.storage`.
4. Copia de precio desde Liquidation Heatmap al hacer clic en una zona.
5. Mensaje superior de confirmacion cuando la herramienta de Heatmap esta activa.
6. Mensajes en espanol/ingles segun URL de Coinglass:
	- `/es/` => espanol
	- resto => ingles

## Paginas soportadas

1. `https://www.coinglass.com/*LongShortRatio*`
2. `https://www.coinglass.com/*LiquidationHeatMap*`
3. `https://es.tradingview.com/chart/*`
4. `https://www.tradingview.com/chart/*`

## Como usar

### 1) Delta en Coinglass y TradingView

1. Abre Long/Short Ratio en Coinglass.
2. La extension calcula el delta y lo guarda.
3. Abre TradingView y veras `Δ` en la barra inferior.

### 2) Copiar precio desde Liquidation Heatmap

1. Abre Liquidation Heatmap en Coinglass.
2. Espera el mensaje superior de herramienta activa.
3. Pasa el cursor por una zona y haz clic.
4. Se copia el valor de `Price`/`Precio` y aparece un toast de confirmacion.

## Instalacion (modo desarrollador)

1. Abre `edge://extensions/`.
2. Activa modo desarrollador.
3. Carga carpeta descomprimida apuntando a este proyecto o a `release/build`.

## Build de version minificada

Se incluye el script `build-release.ps1` para generar una version liviana:

1. Ejecuta en PowerShell:

```powershell
.\build-release.ps1
```

2. Resultado:
	- Carpeta lista: `release/build`
	- ZIP versionado: `release/delta_coinglass_v<version>_min.zip`

### Opciones

```powershell
.\build-release.ps1 -SkipZip
```

Genera solo la carpeta `release/build` sin ZIP.

## Estructura principal

1. `content.js`: Delta en Coinglass Long/Short Ratio.
2. `tradingview.js`: Muestra delta en TradingView.
3. `heatmap-copy.js`: Copia precio en Liquidation Heatmap.
4. `manifest.json`: Configuracion MV3 y rutas.
5. `build-release.ps1`: Build minificado para publicar/actualizar.
