import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { t } from 'lib/i18n/text'
import { customItems } from 'lib/rpg/custom-item'

export const MagicSlimeBall = new ItemStack(MinecraftItemTypes.SlimeBall).setInfo(
  t`§aМагическая слизь`,
  t`Используется у Инженера`,
)
customItems.push(MagicSlimeBall)
