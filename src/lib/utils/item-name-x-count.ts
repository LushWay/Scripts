import { ItemPotionComponent, ItemStack, Player } from '@minecraft/server'
import {
  MinecraftPotionEffectTypes as PotionEffects,
  MinecraftPotionModifierTypes as PotionModifiers,
} from '@minecraft/vanilla-data'
import { Language } from 'lib/assets/lang'
import { langToken, translateToken } from 'lib/i18n/lang'
import { i18n } from 'lib/i18n/text'

/** Returns <item name>\nx<count> */
export function itemNameXCount(
  item: Pick<ItemStack, 'typeId' | 'nameTag' | 'amount'> | ItemStack,
  c = '§7',
  amount = true,
  player: Player | Language,
): string {
  const locale = player instanceof Player ? player.lang : player
  const potion = item instanceof ItemStack && item.getComponent(ItemPotionComponent.componentId)
  if (potion) {
    const { potionEffectType: effect, potionLiquidType: liquid, potionModifierType: modifier } = potion

    const token = langToken(`minecraft:${liquid.id}_${effect.id}_potion`)
    const modifierIndex = modifier.id === PotionModifiers.Normal ? 0 : modifier.id === PotionModifiers.Long ? 1 : 2
    const time = potionModifierToTime[effect.id]?.[modifierIndex]
    const modifierS = modifierIndexToS[modifierIndex]?.to(locale) ?? ''

    return `${c}${item.nameTag ?? translateToken(token, locale)}${modifierS}${time ? ` §7${time}` : ''}`
  }

  return `${c}${item.nameTag ? (c ? uncolor(item.nameTag) : item.nameTag).replace(/\n.*/, '') : translateToken(langToken(item), locale)}${amount && item.amount ? ` §r§f${c}x${item.amount}` : ''}`
}

function uncolor(t: string) {
  return t.replaceAll(/§./g, '')
}

const modifierIndexToS = ['', i18n` (долгое)`, ' II']

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
