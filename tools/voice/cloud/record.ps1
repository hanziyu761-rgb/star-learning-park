# 林亨学习乐园：用“龙呼呼”童声批量预录 APP 里固定的句子（V2.21）
# 用法：在 PowerShell 里进入本文件夹，运行  powershell -ExecutionPolicy Bypass -File .\record.ps1
# - 调用你自己的阿里云 AI 服务（/api/tts），密钥只在阿里云函数里，本脚本不需要也不保存任何密钥
# - 已录好的会跳过，中途断了重新运行即可接着录
# - 录完把 out 文件夹压缩成 zip 发回
# - 先试听：加 -Sample 只录 12 句（中文、英文、多音字各几句），录好后打开 out 文件夹听一听
param([switch]$Sample)
$ErrorActionPreference = 'Stop'
$Base = 'https://star-ai-teacher-hsrmhrryqr.cn-beijing.fcapp.run'
$Voice = 'longhuhu_v3'
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Out = Join-Path $Here 'out'
New-Item -ItemType Directory -Force -Path $Out | Out-Null
$List = Get-Content -Raw -Encoding UTF8 (Join-Path $Here 'list.json') | ConvertFrom-Json
if ($Sample) { $List = Get-Content -Raw -Encoding UTF8 (Join-Path $Here 'try.json') | ConvertFrom-Json }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Fail = @()
$i = 0
foreach ($item in $List) {
  $i++
  $file = Join-Path $Out ($item.id + '.mp3')
  if ((Test-Path $file) -and ((Get-Item $file).Length -gt 1000)) { continue }
  $body = [Text.Encoding]::UTF8.GetBytes((@{ text = $item.text; voice = $Voice; rate = 'normal' } | ConvertTo-Json -Compress))
  $ok = $false
  $lastErr = ''
  for ($attempt = 1; $attempt -le 4 -and -not $ok; $attempt++) {
    try {
      $r = Invoke-RestMethod -Method Post -Uri "$Base/api/tts" -Body $body -ContentType 'application/json; charset=utf-8' -TimeoutSec 30
      Invoke-WebRequest -Uri $r.url -OutFile $file -UseBasicParsing -TimeoutSec 30
      if ((Get-Item $file).Length -gt 1000) { $ok = $true }
    } catch {
      $lastErr = $_.Exception.Message
      Start-Sleep -Seconds (5 * $attempt)
    }
  }
  if (-not $ok) { $Fail += $item.id; Write-Host "失败：$($item.text)（$lastErr）" -ForegroundColor Red }
  if ($i % 50 -eq 0) { Write-Host "进度 $i / $($List.Count)" }
  Start-Sleep -Milliseconds 700
}
$done = (Get-ChildItem $Out -Filter *.mp3 | Where-Object { $_.Length -gt 1000 }).Count
Write-Host ""
Write-Host "录好 $done / $($List.Count) 句" -ForegroundColor Green
if ($Sample) { Write-Host "试听完觉得可以，就去掉 -Sample 再运行一次，录 list.json 里的全部句子" -ForegroundColor Green }
elseif ($Fail.Count) { Write-Host "还有 $($Fail.Count) 句没录上，再运行一次本脚本即可补录" -ForegroundColor Yellow }
else {
  $zip = Join-Path $Here 'tongsheng.zip'
  if (Test-Path $zip) { Remove-Item $zip }
  Compress-Archive -Path (Join-Path $Out '*.mp3') -DestinationPath $zip
  Write-Host "全部录好，已打包：$zip  把它发回来就行" -ForegroundColor Green
}
