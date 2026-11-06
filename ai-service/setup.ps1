$ErrorActionPreference = 'Stop'
$taskTemp = Join-Path $PSScriptRoot '.tmp'
New-Item -ItemType Directory -Force -Path $taskTemp | Out-Null
$env:TEMP = $taskTemp
$env:TMP = $taskTemp

python -m venv --clear .venv
if ($LASTEXITCODE -ne 0) { throw 'Could not create the AI service virtual environment.' }
$python = Join-Path (Get-Location) '.venv\Scripts\python.exe'
& $python -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw 'Could not initialize pip in the AI service virtual environment.' }
& $python -m pip install torch==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cu124
if ($LASTEXITCODE -ne 0) { throw 'Could not install CUDA-enabled PyTorch.' }
& $python -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { throw 'Could not install the AI service dependencies.' }

Write-Host 'AI service dependencies installed. Start the service with:'
Write-Host '.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000'
