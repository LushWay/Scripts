import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { customItems } from 'lib/rpg/custom-item'
import { t } from 'lib/text'

export const MagicSlimeBall = new ItemStack(MinecraftItemTypes.SlimeBall).setInfo(
  t`§aМагическая слизь`,
  t`Используется у Инженера`,
)
customItems.push(MagicSlimeBall)
