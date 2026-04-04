import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { i18n } from 'lib/i18n/text'
import { CustomItem } from 'lib/rpg/custom-item'

export const MagicSlimeBall = new CustomItem('magicSlimeBall')
  .typeId(MinecraftItemTypes.SlimeBall)
  .nameTag(i18n`§aМагическая слизь`)
  .lore(i18n`Используется у Инженера`)
