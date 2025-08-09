Param(
  [Parameter(Mandatory=$true)][string]$Path
)

if (-not (Test-Path -LiteralPath $Path)) {
  Write-Error "File not found: $Path"
  exit 1
}

try {
  $raw = Get-Content -LiteralPath $Path -Raw -ErrorAction Stop
} catch {
  Write-Error "Failed to read file: $Path"
  exit 1
}

try {
  $data = $raw | ConvertFrom-Json -ErrorAction Stop
} catch {
  Write-Error "Invalid JSON in: $Path"
  exit 2
}

if ($null -eq $data.cases) { $data | Add-Member -NotePropertyName cases -NotePropertyValue @() }
if ($null -eq $data.case)  { $data | Add-Member -NotePropertyName case  -NotePropertyValue @() }

# Map of id -> title from list cases
$idToTitle = @{}
$newCases = @()
foreach ($c in @($data.cases)) {
  if ($null -eq $c) { continue }
  $title = ''
  if ($c.PSObject.Properties['title']) { $title = [string]$c.title }
  elseif ($c.PSObject.Properties['name']) { $title = [string]$c.name }
  $obj = [ordered]@{ id = $c.id; title = $title }
  if ($c.PSObject.Properties['updated_date']) { $obj.updated_date = $c.updated_date }
  elseif ($c.PSObject.Properties['updated']) { $obj.updated_date = $c.updated }
  $newCases += [pscustomobject]$obj
  if ($c.id) { $idToTitle[$c.id] = $title }
}

# Helper to normalize attachments
function Normalize-Attachments {
  param([object[]]$arr)
  if (-not $arr) { return @() }
  $out = @()
  foreach ($a in $arr) {
    if ($a -is [string]) {
      $out += [pscustomobject]@{ path = $a }
      continue
    }
    $apath = ''
    if ($a.PSObject.Properties['path']) { $apath = [string]$a.path }
    $atitle = $null
    if ($a.PSObject.Properties['title']) { $atitle = [string]$a.title }
    elseif ($a.PSObject.Properties['name']) { $atitle = [string]$a.name }
    $o = [ordered]@{ path = $apath }
    if ($atitle) { $o.title = $atitle }
    $out += [pscustomobject]$o
  }
  return ,$out
}

# Build detailed entries
Add-Type -AssemblyName 'System.Collections'
$fullIds = New-Object 'System.Collections.Generic.HashSet[string]'
$newFull = @()
foreach ($fc in @($data.case)) {
  if ($null -eq $fc) { continue }
  $id = $fc.id
  if ($id) { [void]$fullIds.Add([string]$id) }
  $title = ''
  if ($fc.PSObject.Properties['title']) { $title = [string]$fc.title }
  elseif ($id -and $idToTitle.ContainsKey($id)) { $title = [string]$idToTitle[$id] }
  $outPath = ''
  if ($fc.PSObject.Properties['path']) { $outPath = [string]$fc.path }
  $files = $fc.files
  $main = ''
  if ($files -and $files.PSObject.Properties['main']) {
    if ($files.main -is [string]) { $main = [string]$files.main }
    elseif ($files.main -is [pscustomobject]) {
      if ($files.main.PSObject.Properties['path']) { $main = [string]$files.main.path }
    }
  }
  $attachments = @()
  if ($files -and $files.PSObject.Properties['attachments']) {
    $attachments = Normalize-Attachments -arr $files.attachments
  }
  $updated = $null
  if ($fc.PSObject.Properties['updated']) { $updated = [string]$fc.updated }
  elseif ($fc.PSObject.Properties['updated_date']) { $updated = [string]$fc.updated_date }

  $ent = [ordered]@{
    id = $id
    title = $title
    path = $outPath
    files = [ordered]@{
      main = $main
      attachments = $attachments
    }
  }
  if ($updated) { $ent.updated = $updated }
  $newFull += [pscustomobject]$ent
}

# Ensure every case has a full entry
foreach ($c in $newCases) {
  if (-not $fullIds.Contains([string]$c.id)) {
    $newFull += [pscustomobject]@{
      id = $c.id
      title = $c.title
      path = ''
      files = [pscustomobject]@{ main = ''; attachments = @() }
    }
  }
}

# Output and write back with backup
$outputObject = [pscustomobject]@{ cases = $newCases; case = $newFull }
$json = $outputObject | ConvertTo-Json -Depth 10
$backup = "$Path.$(Get-Date -Format 'yyyyMMddHHmmss').bak"
try { Copy-Item -LiteralPath $Path -Destination $backup -Force } catch {}
Set-Content -LiteralPath $Path -Value $json -Encoding UTF8
Write-Output "OK wrote: $Path; backup: $backup"