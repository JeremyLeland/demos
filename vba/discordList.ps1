$dir = $args[0]

Get-ChildItem .\$dir\*\*csv | ForEach-Object { 
    Write-Output "$($_.Directory.Name -split 'c' ):".trim()
    ( Import-Csv $_ | ForEach-Object { $_.ID } ) -join ', '
    Write-Output ""
}