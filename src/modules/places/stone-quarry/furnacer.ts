import { ItemStack, TicksPerSecond, system, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Vector, getAuxOrTexture, ms } from 'lib'
import { Sounds } from 'lib/assets/custom-sounds'
import { table } from 'lib/database/abstract'
import { ItemLoreSchema } from 'lib/database/item-stack'
import { actionGuard } from 'lib/region/index'
import { Group, Place } from 'lib/rpg/place'
import { FreeCost, MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { t } from 'lib/text'
import { StoneQuarry } from './stone-quarry'

export class Furnacer extends ShopNpc {
  static create() {
    return Group.pointCreator(place => ({
      furnaces: (furnaces: string[]) => ({
        onlyInStoneQuarry: (onlyInStoneQuarry: boolean) => new Furnacer({ place, furnaces, onlyInStoneQuarry }),
      }),
    }))
  }

  /**
   * List of all Furnacers npc
   *
   * @type {Furnacer[]}
   */
  static npcs: Furnacer[] = []

  furnaceTypeIds

  onlyInStoneQuarry

  /** Item representing key for using furnace */
  keyItem = new ItemStack(MinecraftItemTypes.TripwireHook).setInfo('§6Ключ от печки', '§7Ключ от печки в технограде')

  /**
   * Creates new Furnaceer npc store
   *
   * @param options - Options
   * @param options.npc
   * @param options.furnaceTypeIds - Type ids of the furnace blocks
   * @param options.onlyInStoneQuarry - Whenether to allow using this type of furnace outside Stone quarry
   */
  private constructor({
    place,
    furnaces,
    onlyInStoneQuarry,
  }: {
    place: Place
    furnaces: string[]
    onlyInStoneQuarry: boolean
  }) {
    super(place)
    this.shop.body(() => 'У меня ты можешь купить доступ к печкам\n\n')
    Furnacer.npcs.push(this)

    this.furnaceTypeIds = furnaces
    this.onlyInStoneQuarry = onlyInStoneQuarry

    this.shop.menu((form, player) => {
      const { item } = FurnaceKeyItem.schema.create({
        status: 'notUsed',
        code: (Date.now() - 1_700_000_000_000).toString(32).toUpperCase(),
        player: player.name,
        location: '',
      })

      form.itemStack(item, new MoneyCost(50), getAuxOrTexture(MinecraftItemTypes.TripwireHook, true))
      form.itemModifier(
        'Сдать неиспользуемый ключ',
        FreeCost,
        i => FurnaceKeyItem.schema.is(i),
        'Ключ от печки',
        (slot, _, text) => {
          const parsed = FurnaceKeyItem.schema.parse(slot)
          if (!parsed) return

          const key = Object.entries(FurnaceKeyItem.db).find(e => e[1]?.code === parsed.code)?.[0]
          if (key) Reflect.deleteProperty(FurnaceKeyItem.db, key)
          slot.setItem(undefined)

          form.show(text)

          player.scores.money += 20
          player.playSound(Sounds['lw.pay'])
          return false
        },
      )
    })
  }
}

actionGuard((player, region, ctx) => {
  // Not our event
  if (ctx.type !== 'interactWithBlock') return

  const furnacer = Furnacer.npcs.find(e => e.furnaceTypeIds.includes(ctx.event.block.typeId))
  if (!furnacer) return

  // Restrictions
  const notAllowed = (message = 'Для использования печек вам нужно купить ключ у печкина или взять его в руки!') => {
    system.delay(() => player.fail(message))
    return false
  }

  if (region !== StoneQuarry.safeArea) {
    if (furnacer.onlyInStoneQuarry) {
      return notAllowed('Вы не можете пользоваться печками вне Каменоломни')
    } else return // allow
  }

  const lore = FurnaceKeyItem.schema.parse(player.mainhand(), undefined, false)
  if (!lore) return notAllowed()

  const blockId = Vector.string(ctx.event.block)
  const furnace = FurnaceKeyItem.db[blockId]

  // Access allowed
  if (furnace?.code === lore.code) {
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
          t.error`Эта печка уже занята. Печка освободится через ${t.error.time`${furnace.expires - Date.now()}`}, ключ: ${furnace.code}`,
        )
      }
    } else {
      // Create new...
      system.delay(() => {
        FurnaceKeyItem.db[blockId] = {
          code: lore.code,
          expires: Date.now() + ms.from('hour', 1),
          lastPlayerId: player.id,
        }

        lore.status = 'inUse'
        lore.location = Vector.string(ctx.event.block.location, true)
        lore.player = player.name

        player.success('Ключ теперь привязан к этой печке! Не забудьте забрать из нее ресурсы через час!')
      })

      // Prevent from opening furnace dialog
      return false
    }
  } else return notAllowed('Вы уже использовали этот ключ для другой печки.')
})

class FurnaceKeyItem {
  static db = table<{
    expires: number
    code: string
    lastPlayerId: string
    warnedAboutExpire?: 1
  }>('furnaceKeys')

  static schema = new ItemLoreSchema('furnace key')
    .nameTag(() => '§6Ключ от печки')
    .lore('§7Ключ от печки в технограде. Используйте его чтобы открыть печку')

    .property('code', String)

    .property('location', String)
    .display('Привязан к печке на', l => (!l ? false : l))

    .property('player', String)
    .display('Владелец')

    .property<'status', 'notUsed' | 'inUse' | 'used'>('status', 'notUsed')
    .display('', unit => this.status[unit])
    .build()

  static status = {
    notUsed: '§r§aНе использован',
    inUse: '§r§6Печка плавит...',
    used: '§r§cВремя истекло',
  }

  static {
    system.runInterval(
      () => {
        let players
        for (const [key, furnace] of Object.entries(FurnaceKeyItem.db)) {
          if (typeof furnace === 'undefined') continue
          if (furnace.warnedAboutExpire) continue

          const untilExpire = furnace.expires - Date.now()
          if (untilExpire < ms.from('min', 5)) {
            players ??= world.getAllPlayers()

            const player = players.find(e => e.id === furnace.lastPlayerId)
            if (player) {
              player.warn(
                t`Через 5 минут ресурсы в вашей печке перестанут быть приватными! Печка находится на ${key}, ключ: ${furnace.code}`,
              )

              furnace.warnedAboutExpire = 1
            }
          } else if (untilExpire < 0) {
            Reflect.deleteProperty(FurnaceKeyItem.db, key)
          }
        }
      },
      'FurnaceKey.db expired entries cleanup',
      TicksPerSecond * 5,
    )
  }
}
