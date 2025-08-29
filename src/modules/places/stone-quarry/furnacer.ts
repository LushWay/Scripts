import { ContainerSlot, Player, TicksPerSecond, system, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Vec, getAuxOrTexture, ms } from 'lib'
import { Sounds } from 'lib/assets/custom-sounds'
import { defaultLang } from 'lib/assets/lang'
import { table } from 'lib/database/abstract'
import { ItemLoreSchema } from 'lib/database/item-stack'
import { i18n } from 'lib/i18n/text'
import { ActionGuardOrder, actionGuard } from 'lib/region/index'
import { Group, Place } from 'lib/rpg/place'
import { FreeCost, MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { lockBlockPriorToNpc } from 'modules/survival/locked-features'
import { StoneQuarry } from './stone-quarry'

const furnaceExpireTime = ms.from('hour', 1)
const furnaceExpireTimeText = i18n`Ключ теперь привязан к этой печке! В течении часа вы можете открывать ее с помощью этого ключа!`

export class Furnacer extends ShopNpc {
  static create() {
    return Group.placeCreator(place => ({
      furnaceTypeIds: (furnaceTypeIds: string[]) => ({
        onlyInStoneQuarry: (onlyInStoneQuarry: boolean) => new Furnacer(place, furnaceTypeIds, onlyInStoneQuarry),
      }),
    }))
  }

  /**
   * List of all Furnacers npc
   *
   * @type {Furnacer[]}
   */
  static npcs: Furnacer[] = []

  get id() {
    return this.place.id
  }

  /**
   * Creates new Furnaceer npc store
   *
   * @param options - Options
   * @param options.npc
   * @param options.furnaceTypeIds - Type ids of the furnace blocks
   * @param options.onlyInStoneQuarry - Whenether to allow using this type of furnace outside Stone quarry
   */
  private constructor(
    place: Place,
    readonly furnaceTypeIds: string[],
    onlyInStoneQuarry: boolean,
  ) {
    super(place)
    this.shop.body(() => i18n`У меня ты можешь купить ключ доступа к печкам\n\n`)
    Furnacer.npcs.push(this)

    if (onlyInStoneQuarry) {
      for (const furnace of furnaceTypeIds) {
        lockBlockPriorToNpc(furnace, place.name)
      }
    }

    this.shop.menu((form, player) => {
      const item = this.createItemKey(player)

      form.itemStack(item, new MoneyCost(50), getAuxOrTexture(MinecraftItemTypes.TripwireHook, true))
      form.itemModifier(
        i18n`Сдать неиспользуемый ключ`,
        FreeCost,
        i => FurnaceKeyItem.schema.is(i),
        i18n`Ключ от печки`,
        (slot, _, text) => {
          const parsed = FurnaceKeyItem.schema.parse(player.lang, slot)
          if (!parsed) return

          const key = FurnaceKeyItem.db.entries().find(e => e[1]?.code === parsed.code)?.[0]
          if (key) FurnaceKeyItem.db.delete(key)
          slot.setItem(undefined)

          form.show(text)

          player.scores.money += 20
          player.playSound(Sounds.Pay)
          return false
        },
      )
    })
  }

  createItemKey(player?: Player) {
    return FurnaceKeyItem.schema.create(player?.lang ?? defaultLang, {
      status: 'notUsed',
      furnacer: this.id,
      code: (Date.now() - 1700000000000).toString(32).toUpperCase(),
      player: player?.name ?? '',
      location: '',
    }).item
  }
}

const dontOpenFurnaceDialog = Symbol('dontOpenFurnaceDialog')

actionGuard((player, region, ctx) => {
  // Not our event
  if (ctx.type !== 'interactWithBlock' || !ctx.event.isFirstEvent) return
  if (region !== StoneQuarry.safeArea) return

  const furnaceTypeId = ctx.event.block.typeId
  const furnacer = Furnacer.npcs.find(e => e.furnaceTypeIds.includes(furnaceTypeId))
  if (!furnacer) return

  // Restrictions
  const notAllowed = (
    message = i18n`Для использования печек вам нужно купить ключ у печкина и держать его в инвентаре!`,
  ) => {
    return () => system.delay(() => player.fail(message))
  }

  const tryItem = (slot: ContainerSlot): boolean | typeof dontOpenFurnaceDialog | VoidFunction => {
    const lore = FurnaceKeyItem.schema.parse(player.lang, slot, undefined, false)
    if (!lore) return false

    if (lore.furnacer !== furnacer.id) return notAllowed(i18n`Этот ключ используется для других печек!`)

    const blockId = Vec.string(ctx.event.block)
    const furnace = FurnaceKeyItem.db.get(blockId)

    // Furnace is already taken
    if (furnace && furnace.code === lore.code) {
      // Same key, acess allowed, update metadata
      furnace.lastPlayerId = player.id
      return true
    }

    // Furnace is free, creating access key
    if (lore.status === 'notUsed') {
      // Database record exists
      if (furnace) {
        if (furnace.expires < Date.now()) {
          // Notify previous owner (Maybe?)
        } else {
          return notAllowed(
            i18n.error`Эта печка уже занята. Печка освободится через ${i18n.error.time(furnace.expires - Date.now())}, ключ: ${furnace.code}`,
          )
        }
      } else {
        // Create new...
        system.delay(() => {
          FurnaceKeyItem.db.set(blockId, {
            code: lore.code,
            expires: Date.now() + furnaceExpireTime,
            lastPlayerId: player.id,
          })

          lore.status = 'inUse'
          lore.location = Vec.string(ctx.event.block.location, true)
          lore.player = player.name

          player.success(furnaceExpireTimeText)
        })

        // Prevent from opening furnace dialog
        return dontOpenFurnaceDialog
      }
    }

    return notAllowed(i18n.error`Вы уже использовали этот ключ для другой печки.`)
  }

  let lastError: undefined | VoidFunction
  const entries = player.container?.slotEntries().sort((a, b) => (a[0] === player.selectedSlotIndex ? 1 : -1)) ?? []
  for (const [index, slot] of entries) {
    const result = tryItem(slot)
    if (result === dontOpenFurnaceDialog || result === true) {
      player.info(i18n`Использован ключ из слота ${index}`)
      return result === dontOpenFurnaceDialog ? false : true
    } else if (typeof result === 'function') lastError = result
  }

  ;(lastError ?? notAllowed)()
  return false
}, ActionGuardOrder.Feature)

class FurnaceKeyItem {
  static db = table<{ expires: number; code: string; lastPlayerId: string; warnedAboutExpire?: 1 }>('furnaceKeys')

  static schema = new ItemLoreSchema('furnace key')
    .nameTag(() => i18n`§6Ключ от печки`)
    .lore(i18n`§7Открывает печку в каменоломне.`)

    .property('furnacer', String)

    .property('code', String)

    .property('location', String)
    .display(i18n`На`, l => (!l ? false : l))

    .property('player', String)
    .display(i18n`Владелец`)

    .property<'status', 'notUsed' | 'inUse' | 'used'>('status', 'notUsed')
    .display('', unit => this.status[unit])
    .build()

  static status = {
    notUsed: i18n.nocolor`§r§aНе использован`,
    inUse: i18n.nocolor`§r§6Печка плавит...`,
    used: i18n.nocolor`§r§cВремя истекло`,
  }

  static {
    system.runInterval(
      () => {
        let players
        for (const [key, furnace] of FurnaceKeyItem.db.entries()) {
          if (typeof furnace === 'undefined') continue
          if (furnace.warnedAboutExpire) continue

          const untilExpire = furnace.expires - Date.now()
          if (untilExpire < ms.from('min', 5)) {
            players ??= world.getAllPlayers()

            const player = players.find(e => e.id === furnace.lastPlayerId)
            if (player) {
              player.warn(
                i18n`Через 5 минут ресурсы в вашей печке перестанут быть приватными! Печка находится на ${key}, ключ: ${furnace.code}`,
              )

              furnace.warnedAboutExpire = 1
            }
          } else if (untilExpire < 0) {
            FurnaceKeyItem.db.delete(key)
          }
        }
      },
      'FurnaceKey.db expired entries cleanup',
      TicksPerSecond * 5,
    )
  }
}
