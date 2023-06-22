$dir = $args[0]

ls .\$dir\*\*csv | ForEach-Object { 
    echo "$($_.Directory.Name -split 'c' ):".trim()
    ( Import-Csv $_ | %{ $_.ID } ) -join ', '
    echo ""
}