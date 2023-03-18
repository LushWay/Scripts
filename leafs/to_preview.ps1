
Copy-Item -Path "." -Destination "..\..\..\..\..\..\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState\\games\com.mojang\development_behavior_packs\X-API-PREVIEW" -Recurse -Exclude "$$OLD", ".vscode" -Force

Copy-Item -Path "..\..\minecraftpe" -Destination "..\..\..\..\..\..\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState\\games\com.mojang" -Recurse -Force

Copy-Item -Path "..\..\development_resource_packs\Steltimize" -Destination "..\..\..\..\..\..\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState\\games\com.mojang\development_resource_packs\Steltimize-PREVIEW" -Recurse -Exclude ".git" -Force
