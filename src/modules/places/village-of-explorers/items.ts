import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { customItems } from 'lib/rpg/custom-item'

export const MagicSlimeBall = new ItemStack(MinecraftItemTypes.SlimeBall).setInfo(
  '§aМагическая слизь',
  'Используется у Инженера',
)
customItems.push(MagicSlimeBall)
