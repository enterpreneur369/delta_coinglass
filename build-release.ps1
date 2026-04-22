param(
    [string]$OutputRoot = "release",
    [switch]$SkipZip
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $projectRoot "manifest.json"

if (-not (Test-Path $manifestPath)) {
    throw "No se encontro manifest.json en $projectRoot"
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = $manifest.version

$releaseDir = Join-Path $projectRoot $OutputRoot
$buildDir = Join-Path $releaseDir "build"
$zipPath = Join-Path $releaseDir ("delta_coinglass_v{0}_min.zip" -f $version)

if (Test-Path $buildDir) {
    Remove-Item $buildDir -Recurse -Force
}
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null

$requiredFiles = New-Object System.Collections.Generic.HashSet[string]
$requiredFiles.Add("manifest.json") | Out-Null

if ($manifest.content_scripts) {
    foreach ($cs in $manifest.content_scripts) {
        if ($cs.js) {
            foreach ($f in $cs.js) {
                $requiredFiles.Add($f) | Out-Null
            }
        }
        if ($cs.css) {
            foreach ($f in $cs.css) {
                $requiredFiles.Add($f) | Out-Null
            }
        }
    }
}

if ($manifest.icons) {
    foreach ($iconProp in $manifest.icons.PSObject.Properties) {
        if ($iconProp.Value) {
            $requiredFiles.Add([string]$iconProp.Value) | Out-Null
        }
    }
}

Write-Host "Archivos incluidos en release:"
$requiredFiles | Sort-Object | ForEach-Object { Write-Host " - $_" }

function Invoke-MinifyWithEsbuild {
    param(
        [string]$Source,
        [string]$Destination
    )

    $args = @("--yes", "esbuild", $Source, "--minify", "--legal-comments=none", "--outfile=$Destination")
    $proc = Start-Process -FilePath "npx.cmd" -ArgumentList $args -NoNewWindow -Wait -PassThru
    return $proc.ExitCode -eq 0
}

foreach ($relativePath in ($requiredFiles | Sort-Object)) {
    $src = Join-Path $projectRoot $relativePath
    if (-not (Test-Path $src)) {
        throw "Falta archivo requerido por manifest: $relativePath"
    }

    $dest = Join-Path $buildDir $relativePath
    $destDir = Split-Path -Parent $dest
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    $ext = [System.IO.Path]::GetExtension($relativePath).ToLowerInvariant()

    if ($ext -eq ".js" -or $ext -eq ".css") {
        Write-Host "Minificando $relativePath ..."
        $ok = Invoke-MinifyWithEsbuild -Source $src -Destination $dest
        if (-not $ok) {
            Write-Warning "No se pudo minificar $relativePath, copiando original."
            Copy-Item $src $dest -Force
        }
    }
    else {
        Copy-Item $src $dest -Force
    }
}

if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
}

if (-not $SkipZip) {
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }

    Compress-Archive -Path (Join-Path $buildDir "*") -DestinationPath $zipPath
    Write-Host "ZIP generado: $zipPath"
}

$sourceSize = (Get-ChildItem $projectRoot -Recurse -File | Measure-Object -Property Length -Sum).Sum
$buildSize = (Get-ChildItem $buildDir -Recurse -File | Measure-Object -Property Length -Sum).Sum

Write-Host ""
Write-Host "Tamano carpeta proyecto: $([math]::Round($sourceSize / 1MB, 2)) MB"
Write-Host "Tamano release (solo plugin): $([math]::Round($buildSize / 1KB, 2)) KB"
Write-Host "Listo. Usa la carpeta $buildDir o el ZIP para actualizar la extension."
