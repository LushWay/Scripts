import { ItemStack, Player, TicksPerSecond, Vector, system, world } from '@minecraft/server'

import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { util } from 'lib'
import { MoneyCost } from 'lib/cost'
import { table } from 'lib/database/abstract'
import { actionGuard } from 'lib/region/index'
import { Store } from 'lib/store'
import { StoneQuarry } from '../Places/StoneQuarry/StoneQuarry'

export class Furnacer {
  /**
   * List of all Furnacers npc
   *
   * @type {Furnacer[]}
   */
  static npcs: Furnacer[] = []

  furnaceTypeIds

  npc

  onlyInStoneQuarry

  /** Item representing key for using furnace */
  keyItem = new ItemStack(MinecraftItemTypes.TripwireHook).setInfo('§6Ключ от печки', '§7Ключ от печки в технограде')

  /**
   * // TODO Add multiple key levels
   *
   * @type {ItemStack[]}
   */
  keyItemLevels: ItemStack[] = []

  /**
   * Creates new Furnaceer npc store
   *
   * @param {object} options - Options
   * @param {Omit<import('lib/EditableNpc').EditableNpcProps, 'onInteract'>} options.npc
   * @param {string[]} options.furnaceTypeIds - Type ids of the furnace blocks
   * @param {boolean} options.onlyInStoneQuarry - Whenether to allow using this type of furnace outside Stone quarry
   */

  constructor({
    furnaceTypeIds,
    onlyInStoneQuarry,
    npc: npcOptions,
  }: {
    npc: Omit<import('lib/editable-npc').EditableNpcProps, 'onInteract'>
    furnaceTypeIds: string[]
    onlyInStoneQuarry: boolean
  }) {
    Furnacer.npcs.push(this)

    this.furnaceTypeIds = furnaceTypeIds
    this.onlyInStoneQuarry = onlyInStoneQuarry
    this.npc = Store.npc({
      body: p => 'У меня ты можешь купить доступ к печкам\n\n' + this.npc.store.defaultOptions.body(p),
      ...npcOptions,
    })

    this.npc.store.addItem(player => {
      const item = this.keyItem.clone()
      item.setLore(
        FurnaceKeyItem.stringifyLore({
          status: 'notUsed',
          code: (Date.now() - 1_700_000_000_000).toString(32).toUpperCase(),
          lastPlayerId: player.id,
        }),
      )
      return item
    }, new MoneyCost(5))
  }
}

actionGuard((player, region, ctx) => {
  // Not our event

  if (ctx.type !== 'interactWithBlock') return

  const furnaceer = Furnacer.npcs.find(e => e.furnaceTypeIds.includes(ctx.event.block.typeId))
  if (!furnaceer) return

  if (region !== StoneQuarry.safeArea) {
  }

  // Restrictions
  const notAllowed = (message = 'Для использования печек вам нужно купить ключ у печкина или взять его в руки!') => {
    system.delay(() => ctx.event.player.fail(message))
    return false
  }

  if (!ctx.event.itemStack) return notAllowed()

  if (ctx.event.itemStack.typeId !== furnaceer.keyItem.typeId) return notAllowed()

  const lore = FurnaceKeyItem.parseLore(ctx.event.itemStack.getLore())
  if (!lore) return notAllowed()

  const blockId = Vector.string(ctx.event.block)

  const furnace = FurnaceKeyItem.db[blockId]

  // Access allowed
  if (furnace && furnace.code === lore.code) {
    furnace.lastPlayerId = player.id
    return true
  }

  // Furnace is free, creating access key
  if (lore.status === 'notUsed') {
    if (furnace) {
      if (furnace.expires < Date.now()) {
        // Notify previous owner (Maybe?)
      } else {
        const remaining = util.ms.remaining(furnace.expires - Date.now())
        return notAllowed(
          `Эта печка уже занята. Печка освободится через §f${remaining.value} §c${remaining.type}, ключ: §f${furnace.code}`,
        )
      }
    }

    // Create new...
    system.delay(() => {
      FurnaceKeyItem.db[blockId] = {
        code: lore.code,
        expires: Date.now() + util.ms.from('hour', 1),
        lastPlayerId: player.id,
      }
      player.success('Ключ теперь привязан к этой печке! Не забудьте забрать из нее ресурсы через час!')

      ctx.event.itemStack?.setLore(
        FurnaceKeyItem.stringifyLore({ ...lore, status: 'inUse', location: Vector.string(ctx.event.block.location) }),
      )

      player.mainhand().setItem(ctx.event.itemStack)
    })

    // Prevent from opening furnace dialog
    return false
  } else return notAllowed('Вы уже использовали этот ключ для другой печки.')
})

system.runInterval(
  () => {
    let players
    for (const [key, furnace] of Object.entries(FurnaceKeyItem.db)) {
      if (!furnace) continue
      if (furnace.warnedAboutExpire) continue

      const untilExpire = furnace.expires - Date.now()
      if (untilExpire < util.ms.from('min', 5)) {
        players ??= world.getAllPlayers()

        const player = players.find(e => e.id === furnace.lastPlayerId)
        if (player) {
          player.warn(
            `Через 5 минут ресурсы в вашей печке перестанут быть приватными! §7Печка находится на §f${key}§7, ключ: §f${furnace.code}`,
          )

          furnace.warnedAboutExpire = 1
        }
      } else if (untilExpire < 0) {
        delete FurnaceKeyItem.db[key]
      }
    }
  },
  'FurnaceKey.db expired entries cleanup',
  TicksPerSecond * 5,
)

type FurnaceKeyInfo = {
  code: string
  status: keyof (typeof FurnaceKeyItem)['status']
  location?: string
  lastPlayerId?: string
  lastPlayerName?: string
}

class FurnaceKeyItem {
  static db = table<{
    expires: number
    code: string
    lastPlayerId: string
    warnedAboutExpire?: 1
  }>('furnaceKeys')

  static status = {
    notUsed: '§r§aНе использован',
    inUse: '§r§6Печка плавит...',
    used: '§r§cВремя истекло',
  }

  static strings = {
    number: '§r§7Номер ключа: §f',
    location: '§r§7Привязан к печке на: §f',
    player: '§r§7Игрок: §f',
    id: '\x01',
  }

  /**
   * Stringifies info into an array of strings that represent information about a key, including its code, location, and
   * status.
   *
   * @param key - Key info
   */

  static stringifyLore(key: FurnaceKeyInfo) {
    const name = key.lastPlayerName || (key.lastPlayerId ? Player.name(key.lastPlayerId) : undefined)
    return [
      ...util.wrapLore('§7Ключ от печки в технограде. Используйте его чтобы открыть печку'),
      ' ',
      this.strings.number + key.code,
      key.location ? this.strings.location + key.location : ' ',
      name ? this.strings.player + name : '',

      this.status[key.status],
    ].filter(e => e !== '')
  }

  /**
   * Parses provided item lore into key object
   *
   * @param lore - Lore to parse
   * @returns - False if lore is invalid and key object otherwise
   */

  static parseLore(lore: string[]): FurnaceKeyInfo | false {
    let code = ''
    let status: undefined | keyof (typeof FurnaceKeyItem)['status']
    let location
    let lastPlayerName
    for (const line of lore) {
      if (line.startsWith(this.strings.number)) {
        code = line.replace(this.strings.number, '')
      }

      if (line.startsWith(this.strings.location)) {
        location = line.replace(this.strings.location, '')
      }

      if (line.startsWith(this.strings.player)) {
        lastPlayerName = line.replace(this.strings.player, '')
      }

      const statusValue = Object.entriesStringKeys(FurnaceKeyItem.status).find(e => e[1] === line)
      if (statusValue) status = statusValue[0]
    }

    if (!code || !status) return false
    return { code, status, location, lastPlayerName }
  }
}
