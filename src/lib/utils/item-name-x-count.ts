import { ItemPotionComponent, ItemStack, RawMessage } from '@minecraft/server'
import {
  MinecraftPotionEffectTypes as PotionEffects,
  MinecraftPotionModifierTypes as PotionModifiers,
} from '@minecraft/vanilla-data'
import { t } from 'lib/text'
import { noBoolean } from 'lib/util'
import { langToken } from 'lib/utils/lang'

/**
 * Returns <item name>\nx<count>
 *
 * @param {ItemStack} item
 */

export function itemNameXCount(
  item: Pick<ItemStack, 'typeId' | 'nameTag' | 'amount'> | ItemStack,
  c = '§7',
  amount = true,
): RawMessage {
  const colorMessage: RawMessage | false = c ? { text: c } : false
  const potion = item instanceof ItemStack && item.getComponent(ItemPotionComponent.componentId)
  if (potion) {
    const { potionEffectType: effect, potionLiquidType: liquid, potionModifierType: modifier } = potion

    const lang = langToken(`minecraft:${liquid.id}_${effect.id}_potion`)
    const modifierIndex = modifier.id === PotionModifiers.Normal ? 0 : modifier.id === PotionModifiers.Long ? 1 : 2
    const time = potionModifierToTime[effect.id]?.[modifierIndex]
    const modifierS = modifierIndexToS[modifierIndex]

    return {
      rawtext: [
        colorMessage,
        item.nameTag ? { text: item.nameTag } : { translate: lang },
        modifierS ? { text: modifierS } : false,
        time ? { text: ` §7${time}` } : false,
      ].filter(noBoolean),
    }
  }

  return {
    rawtext: [
      colorMessage,
      item.nameTag
        ? { text: (c ? uncolor(item.nameTag) : item.nameTag).replace(/\n.*/, '') }
        : { translate: langToken(item) },
      amount && item.amount ? { text: ` §r§f${c}x${item.amount}` } : false,
    ].filter(noBoolean),
  }
}

function uncolor(t: string) {
  return t.replaceAll(/§./g, '')
}

const modifierIndexToS = ['', t` (долгое)`, ' II']

// TODO Ensure it works properly for all modifiers
const potionModifierToTime: Record<string, undefined | [normal: string, longPlus: string, levelTwo: string]> = {
  [PotionEffects.Healing]: ['0:45', '2:00', '0:22'],
  [PotionEffects.Swiftness]: ['3:00', '8:00', '1:30'],
  [PotionEffects.FireResistance]: ['3:00', '8:00', ''],
  [PotionEffects.NightVision]: ['3:00', '8:00', ''],
  [PotionEffects.Strength]: ['3:00', '8:00', '1:30'],
  [PotionEffects.Leaping]: ['3:00', '8:00', '1:30'],
  [PotionEffects.WaterBreath]: ['3:00', '8:00', ''],
  [PotionEffects.Invisibility]: ['3:00', '8:00', ''],
  [PotionEffects.SlowFalling]: ['1:30', '4:00', ''],

  [PotionEffects.Poison]: ['0:45', '2:00', '0:22'],
  [PotionEffects.Weakness]: ['1:30', '4:00', ''],
  [PotionEffects.Slowing]: ['1:30', '4:00', ''],
  [PotionEffects.Harming]: ['', '', ''],
  [PotionEffects.Wither]: ['0:40', '', ''],
  [PotionEffects.Infested]: ['3:00', '', ''],
  [PotionEffects.Weaving]: ['3:00', '', ''],
  [PotionEffects.Oozing]: ['3:00', '', ''],
  [PotionEffects.WindCharged]: ['3:00', '', ''],

  [PotionEffects.TurtleMaster]: ['0:20', '0:40', '0:20'],
  [PotionEffects.None]: ['', '', ''],
} satisfies Record<PotionEffects, [normal: string, longPlus: string, levelTwo: string]>
