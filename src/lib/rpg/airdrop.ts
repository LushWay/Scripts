import { Entity, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { CustomEntityTypes } from 'lib/assets/config'
import { actionGuard } from 'lib/region/index'
import { LootTable } from 'lib/rpg/loot-table'
import { t } from 'lib/text'
import { Vector } from 'lib/vector'
import { table } from '../database/abstract'
import { Core } from '../extensions/core'
import { isInvalidLocation } from '../game-utils'
import { Temporary } from '../temporary'
import { MinimapNpc, resetMinimapNpcPosition, setMinimapNpcPosition } from './minimap'

// TODO Refactor to use creator style for creating
// TODO Make internal properties private
// TODO Make creator to register airdrop with id that will replace loot table id and make .spawn function on it

export class Airdrop {
  static db = table<{ chicken: string; chest: string; loot: string; for?: string; looted?: true }>('airdrop')

  static chestTypeId = CustomEntityTypes.Loot

  static chickenTypeId = MinecraftEntityTypes.Chicken

  static entities = [this.chestTypeId, this.chickenTypeId]

  static chestTag = 'chest_minecart:loot'

  static chickenTag = 'chicken:loot'

  static chestOffset = { x: 0, y: -1.2, z: 0 }

  static instances: Airdrop[] = []

  static minimaped: Airdrop | undefined

  chest: Entity | undefined

  chicken: Entity | undefined

  for

  id

  private lootTable

  status: 'restoring' | 'falling' | 'being looted' = 'restoring'

  constructor(options: { loot: LootTable; forPlayerId?: string }, id?: string) {
    this.lootTable = options.loot
    this.for = options.forPlayerId

    if (!id) {
      this.id = new Date().toISOString()
    } else {
      this.id = id
    }

    Airdrop.instances.push(this)
  }

  /**
   * Spawns airdrop at the given position
   *
   * @param position - Position to spawn airdrop on
   */
  spawn(position: Vector3) {
    console.debug('Airdrop spawning at', Vector.string(Vector.floor(position), true))

    const spawn = (name: 'chicken' | 'chest', typeId: string, position: Vector3, tag: string) => {
      this[name] = world.overworld.spawnEntity(typeId, position)

      new Temporary(({ world, cleanup }) => {
        world.afterEvents.entitySpawn.subscribe(event => {
          if (event.entity.id !== this[name]?.id) return

          event.entity.addTag(tag)
          if (name === 'chest') event.entity.nameTag = `§l§f§kii§r§b Аирдроп §k§f§lii§r`
          console.debug('Airdrop spawned ' + name)
          cleanup()
        })
      })
    }

    spawn('chicken', `${Airdrop.chickenTypeId}<chicken:drop>`, position, Airdrop.chickenTag)
    spawn('chest', Airdrop.chestTypeId, Vector.add(position, Airdrop.chestOffset), Airdrop.chestTag)

    this.status = 'falling'
    this.save()

    return this
  }

  createMarkerOnMinimap(players = world.getAllPlayers()) {
    if (!this.chest) return

    Airdrop.minimaped = this
    const { x, z } = Vector.floor(this.chest.location)

    for (const player of players) {
      setMinimapNpcPosition(player, MinimapNpc.Airdrop, x, z)
    }

    return this
  }

  teleport() {
    if (!this.chest || !this.chicken || !this.chicken.isValid() || !this.chest.isValid()) return

    this.chest.teleport(Vector.add(this.chicken.location, Airdrop.chestOffset))
    if (!this.chest.dimension.getBlock(this.chest.location)?.below()?.isAir) {
      this.beingLooted()
    }
  }

  beingLooted() {
    if (!this.chest || !this.chicken) return

    try {
      console.debug('Loading loot table', this.lootTable.id ? this.lootTable.id : 'NO ID')
      if (this.chest.container) this.lootTable.fillContainer(this.chest.container)
    } catch (e) {
      console.error('Failed to load loot table into airdrop:', e)
    }

    this.chicken.remove()
    this.status = 'being looted'
    this.save()
  }

  save() {
    if (!this.chest || !this.chicken) return
    if (!this.lootTable.id) {
      console.warn(t`[Airdrop][${this.id}] Unable to save, LootTable must have an id`)
      return
    }

    Airdrop.db[this.id] = {
      for: this.for,
      chest: this.chest.id,
      chicken: this.chicken.id,
      loot: this.lootTable.id,
      ...(this.status === 'being looted' ? { looted: true } : {}),
    }
  }

  /** Shows particle trace under chest minecart */
  showParticleTrace(entity = this.chicken) {
    if (!entity?.isValid()) return { x: 0, y: 0, z: 0 }

    const from = entity.location
    const { x, z } = from

    show()
    async function show() {
      for (let y = from.y; y > from.y - 10; y--) {
        try {
          world.overworld.spawnParticle('minecraft:balloon_gas_particle', { x, y, z })
          await system.sleep(3)
        } catch (error) {
          if (isInvalidLocation(error)) continue
          console.error(error)
        }
      }
    }

    return from
  }

  delete() {
    Airdrop.instances = Airdrop.instances.filter(e => e !== this)
    Reflect.deleteProperty(Airdrop.db, this.id)

    /** @param {'chest' | 'chicken'} key */
    const kill = (key: 'chest' | 'chicken') => {
      try {
        this[key]?.remove()
      } catch {}
    }

    kill('chest')
    kill('chicken')
  }
}

const interval = 5
let i = 0
system.runInterval(
  () => {
    i++
    // Perform heavy operations only each 20 ticks
    const canPerformHeavyOperation = i % (20 / interval) === 0
    if (canPerformHeavyOperation) i = 0

    let chestMinecarts
    let chickens

    for (const airdrop of Airdrop.instances) {
      if (airdrop.status === 'falling') {
        airdrop.teleport()
        continue
      }

      if (!canPerformHeavyOperation) continue

      chestMinecarts ??= world.overworld.getEntities({
        type: Airdrop.chestTag,
        tags: [Airdrop.chestTag],
      })
      chickens ??= world.overworld.getEntities({
        type: Airdrop.chickenTypeId,
        tags: [Airdrop.chickenTag],
      })

      if (airdrop.status === 'restoring') {
        try {
          const saved = Airdrop.db[airdrop.id]
          if (typeof saved === 'undefined') return airdrop.delete()

          airdrop.chest = findAndRemove(chestMinecarts, saved.chest)
          airdrop.chicken = findAndRemove(chickens, saved.chicken)

          if (saved.looted) {
            if (airdrop.chest?.isValid()) {
              airdrop.status = 'being looted'
              console.debug('Restored looted airdrop')
            }
          } else {
            if (airdrop.chicken?.isValid() && airdrop.chest?.isValid()) {
              console.debug('Restored failling airdrop')

              airdrop.status = 'falling'
            }
          }
        } catch (error) {
          console.error('Failed to restore airdrop', error)
        }
      } else {
        if (airdrop.chest) findAndRemove(chestMinecarts, airdrop.chest.id)

        // Clear empty looted airdrops
        if (inventoryIsEmpty(airdrop.chest)) {
          if (airdrop === Airdrop.minimaped) {
            for (const player of world.getAllPlayers()) resetMinimapNpcPosition(player, MinimapNpc.Airdrop)
          }
          if (airdrop.chicken) findAndRemove(chickens, airdrop.chicken.id)
          airdrop.delete()
        }
      }

      cleanup(chestMinecarts, 'chest')
      cleanup(chickens, 'chicken')
    }
  },
  'airdrop tp/restore',
  interval,
)

export function inventoryIsEmpty(entity: Entity | undefined) {
  if (!entity?.isValid()) return false

  const { container } = entity
  if (!container) return false // Skip unloaded

  if (container.emptySlotsCount === container.size) return true
}

function cleanup(arr: Entity[], type: 'chest' | 'chicken') {
  for (const entity of arr) {
    if (!entity.isValid()) continue

    if (!Airdrop.instances.find(e => e[type]?.id === entity.id)) {
      entity.remove()
    }
  }
}

/** Finds entity in entity array by id and removes it from array */
const findAndRemove = (arr: Entity[], id: string) => {
  const i = arr.findIndex(e => e.id === id)
  if (i !== -1) return arr.splice(i, 1)[0]
}

Core.afterEvents.worldLoad.subscribe(() => {
  for (const [key, saved] of Object.entries(Airdrop.db)) {
    if (typeof saved === 'undefined') continue
    const loot = LootTable.instances.get(saved.loot)

    const restore = (loot: LootTable) => new Airdrop({ loot, forPlayerId: saved.for }, key)

    if (!loot) {
      LootTable.onNew.subscribe(lootTable => {
        if (lootTable.id === saved.loot) restore(lootTable)
      })
    } else {
      restore(loot)
    }
  }
})

actionGuard((player, _region, ctx) => {
  if (ctx.type === 'interactWithEntity' && ctx.event.target.typeId === Airdrop.chestTypeId) {
    const airdrop = Airdrop.instances.find(e => e.chest?.id === ctx.event.target.id)

    if (airdrop?.for) {
      // Check if airdrop is for specific user

      if (player.id !== airdrop.for) return false
      return true
    } else {
      // Allow interacting with any airdrop by default
      return true
    }
  }
}, -1)
