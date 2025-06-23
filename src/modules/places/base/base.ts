import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { createLogger } from 'lib/utils/logger'
import './actions/create'
import './actions/rotting'
import './actions/upgrade'

import './actions/on-full-restore'
import { t } from 'lib/text'

export const BaseItem = new CustomItemWithBlueprint('base')
  .typeId(MinecraftItemTypes.Barrel)
  .nameTag(t`§6База`)
  .lore(t`Поставьте эту бочку и она станет базой.`)

export const baseLogger = createLogger('Base')
