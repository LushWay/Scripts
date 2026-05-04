import { ContainerSlot, ItemStack, Player, TicksPerSecond, system, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'

import { InventoryInterval } from 'lib/action'
import { Items } from 'lib/assets/custom-items'
import { Sounds } from 'lib/assets/custom-sounds'
import { defaultLang } from 'lib/assets/lang'
import { Clan } from 'lib/clan/clan'
import { Cooldown } from 'lib/cooldown'
import { table } from 'lib/database/abstract'
import { ItemLoreSchema } from 'lib/database/item-stack'
import { EventSignal } from 'lib/event-signal'
import { getAuxOrTexture } from 'lib/form/chest'
import { i18n } from 'lib/i18n/text'
import { ActionGuardOrder, actionGuard } from 'lib/region/index'
import { Group, Place } from 'lib/rpg/place'
import { FreeCost, MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { ms } from 'lib/utils/ms'
import { Vec } from 'lib/vector'
import { lockBlockPriorToNpc } from 'modules/survival/locked-features'
import { StoneQuarry } from './stone-quarry'

const furnaceExpireTime = ms.from('hour', 1)
const furnaceExpireTimeText = i18n`Ключ теперь привязан к этой печке! В течении часа вы можете открывать ее с помощью этого ключа!`

export class Furnacer extends ShopNpc {
  static create() {
    return Group.placeCreator(place => ({
      furnaceTypeIds: (furnaceTypeIds: string[]) => ({
        body: (body: Text) => ({
          onlyInStoneQuarry: (onlyInStoneQuarry: boolean) =>
            new Furnacer(place, furnaceTypeIds, onlyInStoneQuarry, body),
        }),
      }),
    }))
  }

  /**
   * List of all Furnacers npc
   *
   * @type {Furnacer[]}
   */
  static npcs: Furnacer[] = []

  static findById(id: string) {
    return this.npcs.find(e => e.id === id)
  }

  static findByFurnace(furnaceTypeId: string) {
    return this.npcs.find(e => e.furnaceTypeIds.includes(furnaceTypeId))
  }

  get id() {
    return this.place.id
  }

  // Used for learning
  public readonly onFurnaceLock = new EventSignal<{ player: Player }>()

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
    body: Text,
  ) {
    super(place)
    this.shop.body(() => body)
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

  isKey(itemStack: ItemStack): boolean {
    return FurnaceKeyItem.schema.parse(defaultLang, itemStack, {}, false)?.furnacer === this.id
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
  const furnacer = Furnacer.findByFurnace(furnaceTypeId)
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
    if (furnace?.code === lore.code) {
      // Same key, access allowed, update metadata
      furnace.lastPlayerId = player.id
      return true
    }

    if (lore.status === 'used') {
      return notAllowed(i18n`Ключ истек. Купите новый, если вам нужно забрать ресурсы, оставшиеся в этой печке`)
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
        const keys = [...FurnaceKeyItem.db.entriesImmutable()]
        const personalKeys = keys.filter(e => e[1]?.lastPlayerId === player.id)
        if (personalKeys.length >= 3) return notAllowed(i18n`Вы уже заняли ${personalKeys.length}/3 печек.`)

        const clanKeys = keys.filter(e => e[1] && Clan.getPlayerClan(e[1].lastPlayerId)?.isMember(player.id))
        if (clanKeys.length >= 3) return notAllowed(i18n`Ваш клан уже занял ${clanKeys.length}/3 печек.`)

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

          EventSignal.emit(furnacer.onFurnaceLock, { player })
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

const checkCooldown = new Cooldown(ms.from('sec', 5), false, {})

InventoryInterval.mainhand.subscribe(({ player, slot }) => {
  if (slot.typeId !== Items.Key || !checkCooldown.isExpired(player)) return

  const key = FurnaceKeyItem.schema.parse(player.lang, slot)
  if (!key) {
    // Maybe set lore to "WARNING THIS ITEM IS OLD"
    return
  }

  if (key.status !== 'inUse') return

  const furnace = [...FurnaceKeyItem.db.entriesImmutable()].find(e => e[1]?.code === key.code)

  console.log({ k: key.status })
  if (!furnace) {
    key.status = 'used'
  }
})

class FurnaceKeyItem {
  static db = table<{ expires: number; code: string; lastPlayerId: string; warnedAboutExpire?: 1 }>('furnaceKeys')

  static schema = new ItemLoreSchema('furnace key')
    .nameTag(() => i18n`§6Ключ от печки`)
    .lore(i18n`§7Открывает печку в каменоломне.`)

    .property('furnacer', String)
    .display(i18n`Продавец`, unit => Furnacer.findById(unit)?.npc.name ?? i18n`Неизвестен`)

    .property('code', String)

    .property('location', String)
    .display(i18n`На`, l => (!l ? false : l))

    .property('player', String)
    .display(i18n`Владелец`)

    .property<'status', 'notUsed' | 'inUse' | 'used'>('status', 'notUsed')
    .display(i18n`Статус`, unit => this.status[unit])
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
          if (typeof furnace === 'undefined' || furnace.expires === 0) continue

          const untilExpire = furnace.expires - Date.now()
          if (!furnace.warnedAboutExpire && untilExpire < ms.from('min', 5)) {
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
