param($csvPath, $srcFolder, $renamedFolder)

New-Item -Path $renamedFolder -ItemType Directory

$csv = Import-Csv -Path $csvPath -Header 'From','To'

foreach($line in $csv)
{ 
    
    $from = Join-Path -Path $srcFolder -ChildPath $line.From
    $to = Join-Path -Path $renamedFolder -ChildPath $line.To

    #preview
    Write-Output "Copy-Item -Path $($from) -Destination $($to)"

    Copy-Item -Path $from -Destination $to
} 