param($csvPath, $srcFolder, $renamedFolder)

#$csvPath = "C:\Users\iggam\Documents\rachel\RenameFiles.csv"
#$srcFolder = "C:\Users\iggam\Documents\rachel\All-CARA-Images-Unsorted\"
#$renamedFolder = "C:\Users\iggam\Documents\rachel\All-CARA-renamed\"

New-Item -Path $renamedFolder -ItemType Directory

$csv = Import-Csv -path $csvPath

foreach($line in $csv)
{ 
    
    $from = Join-Path -Path $srcFolder -ChildPath $line.File_Name
    $to = Join-Path -Path $renamedFolder -ChildPath $line.'New Name'

    #preview
    Write-Output "Copy-Item -Path $($from) -Destination $($to)"

    Copy-Item -Path $from -Destination $to
} 