$package = (Get-Content "./package.json" | ConvertFrom-Json)
$version = $package.dependencies."@minecraft/server"

node.exe "$env:APPDATA/npm/node_modules/yarn/bin/yarn.js" add "@minecraft/server@$version"
