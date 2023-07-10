$dir = $args[0]

Get-ChildItem .\$dir\*\channel.json | ForEach-Object { 
  $json = Get-Content $_ -Raw | ConvertFrom-Json  
  if ( $json.guild.name -eq "August 2021 Bumpers" ) {
    Write-Output ( $json.id + ":" )

    ( Import-Csv ( $_.Directory.FullName + "\messages.csv" ) | ForEach-Object { $_.ID } ) -join ', '
    Write-Output ""
  }
}