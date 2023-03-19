$Beta = "..\..\..\..\..\..\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState\games\com.mojang"

function Copy-Exclude($Path, $Destination, $Exclude) {
  $Dest = "$Beta\$Destination"
 
  Remove-Item $Dest -Force -Recurse

  New-Item $Dest -ItemType Directory

  Copy-Item $Path $Dest -Recurse -Exclude $Exclude
}


Copy-Exclude ".\*" "development_behavior_packs\X-API-PREVIEW\"  @("node_modules", ".git", ".vscode", "*yarn*", "*.log", "*.md", "LICENSE", "package.json", ".gitignore", "leafs") 

Copy-Exclude "..\..\development_resource_packs\Steltimize\*" "development_resource_packs\Steltimize-PREVIEW\" @("`$OLD", ".vscode", "*.txt")

Copy-Item "..\..\minecraftpe\" "$Beta\" -Recurse -Force