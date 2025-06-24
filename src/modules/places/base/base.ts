import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { createLogger } from 'lib/utils/logger'
import './actions/create'
import './actions/rotting'
import './actions/upgrade'

import { t } from 'lib/i18n/text'
import './actions/on-full-restore'

export const BaseItem = new CustomItemWithBlueprint('base')
  .typeId(MinecraftItemTypes.Barrel)
  .nameTag(t`§6База`)
  .lore(t`Поставьте эту бочку и она станет базой.`)

export const baseLogger = createLogger('Base')
