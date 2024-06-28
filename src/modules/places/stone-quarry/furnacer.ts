import { ItemStack, TicksPerSecond, system, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Vector, ms, util } from 'lib'
import { table } from 'lib/database/abstract'
import { ItemLoreSchema } from 'lib/database/item-stack'
import { actionGuard } from 'lib/region/index'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc, ShopNpcOptions } from 'lib/shop/npc'
import { t } from 'lib/text'
import { StoneQuarry } from './stone-quarry'

export class Furnacer extends ShopNpc {
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
  constructor({
    npc,
    furnaces,
    onlyInStoneQuarry,
  }: {
    npc: Omit<ShopNpcOptions, 'body' | 'dimensionId'>
    furnaces: string[]
    onlyInStoneQuarry: boolean
  }) {
    super({
      body: () => 'У меня ты можешь купить доступ к печкам\n\n',
      ...npc,
    })
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

      form.addItemStack(item, new MoneyCost(5))
    })
  }
}

actionGuard((player, region, ctx) => {
  // Not our event
  if (ctx.type !== 'interactWithBlock') return
  if (region !== StoneQuarry.safeArea) return

  const furnacer = Furnacer.npcs.find(e => e.furnaceTypeIds.includes(ctx.event.block.typeId))
  if (!furnacer) return

  // Restrictions
  const notAllowed = (message = 'Для использования печек вам нужно купить ключ у печкина или взять его в руки!') => {
    system.delay(() => player.fail(message))
    return false
  }

  if (!ctx.event.itemStack) return notAllowed()
  if (ctx.event.itemStack.typeId !== furnacer.keyItem.typeId) return notAllowed()

  const lore = FurnaceKeyItem.schema.parse(player.mainhand())
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

        player.mainhand().setItem(ctx.event.itemStack)
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
