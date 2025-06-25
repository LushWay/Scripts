import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { i18n } from 'lib/i18n/text'
import { customItems } from 'lib/rpg/custom-item'

export const MagicSlimeBall = new ItemStack(MinecraftItemTypes.SlimeBall).setInfo(
  i18n`§aМагическая слизь`,
  i18n`Используется у Инженера`,
)
customItems.push(MagicSlimeBall)
