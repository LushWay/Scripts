import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { createLogger } from 'lib/utils/logger'

export const BaseItem = new CustomItemWithBlueprint('base')
  .typeId(MinecraftItemTypes.Barrel)
  .nameTag('§6База')
  .lore('Поставьте эту бочку и она станет базой.')

export const baseLogger = createLogger('Base')
