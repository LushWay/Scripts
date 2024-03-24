import { Entity, PlayerInteractWithEntityBeforeEvent, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { Temporary, chunkIsUnloaded } from 'lib.js'
import { util } from 'lib/util.js'
import { isBuilding } from 'modules/Build/isBuilding.js'
import { EditableLocation } from './EditableLocation.js'

/**
 * @typedef {ConstructorParameters<typeof EditableNpc>[0]} EditableNpcProps
 */

export class EditableNpc {
  static type = MinecraftEntityTypes.Npc
  static propertyName = 'type'

  /**
   * @type {EditableNpc[]}
   */
  static npcs = []
  /**
   * @type {Entity | undefined}
   */
  entity

  /**
   * Creates new dynamically loadable npc
   * @param {object} o - Options
   * @param {string} o.id - Type name of the npc. Used to restore npc pointer after script reload
   * @param {(event: Omit<PlayerInteractWithEntityBeforeEvent, 'cancel'>) => void} o.onInteract - Function that gets called on interact
   * @param {string} o.name - NameTag of the npc
   * @param {Dimensions} [o.dimensionId] - Dimension id
   * @param {number} [o.skin] - Index of the npc skin
   */
  constructor({ id, name, onInteract, dimensionId = 'overworld', skin }) {
    this.id = id
    this.name = name
    this.onInteract = onInteract
    this.dimensionId = dimensionId
    this.skinIndex = skin

    this.location = new EditableLocation(id + ' NPC').safe
    this.location.onLoad.subscribe(location => {
      if (this.entity) this.entity.teleport(location)
    })

    EditableNpc.npcs.push(this)
  }

  spawn() {
    console.debug('Spawning npc')
    if (!this.location.valid) {
      throw new TypeError(`§cNpc(§r${this.id}§r§c): Location is not valid, spawn is impossible. Set location first`)
    }

    this.entity = world[this.dimensionId].spawnEntity(EditableNpc.type, this.location)

    new Temporary(({ world, cleanup }) => {
      world.afterEvents.entitySpawn.subscribe(({ entity }) => {
        if (entity.id !== this.entity?.id) return

        this.setupNpc(entity)
        cleanup()
      })
    })
  }

  /**
   * @param {Entity} entity
   */
  setupNpc(entity) {
    const npc = entity.getComponent('npc')
    if (!npc) return

    entity.setDynamicProperty(EditableNpc.propertyName, this.id)
    npc.name = this.name
    if (typeof this.skinIndex === 'number') npc.skinIndex = this.skinIndex
  }
}

world.beforeEvents.playerInteractWithEntity.subscribe(event => {
  if (event.target.typeId !== MinecraftEntityTypes.Npc) return
  if (isBuilding(event.player) && event.player.isSneaking) return

  event.cancel = true
  system.run(() => {
    try {
      const npc = EditableNpc.npcs.find(e => e.entity?.id === event.target.id)
      const comp = event.target.getComponent('npc')
      if (!npc)
        return event.player.fail(
          `§f${comp ? comp.name : event.target.nameTag}: §cЯ не могу с вами говорить. Приходите позже.`
        )

      npc.onInteract(event)
    } catch (e) {
      event.player.fail('Не удалось открыть диалог. Сообщите об этом администрации.')
      util.error(e)
    }
  })
})

system.runInterval(
  () => {
    /**
     * Store entities from each dimension so we are not grabbing them much
     * @type {Partial<Record<Dimensions, { npc: any, entity: Entity }[]>>}
     */
    const cache = {}

    EditableNpc.npcs.forEach(npc => {
      if (npc.entity) return // Entity already loaded

      const location = npc.location
      if (!location.valid) return
      if (chunkIsUnloaded({ dimensionId: npc.dimensionId, location })) return

      const npcs = (cache[npc.dimensionId] ??= world[npc.dimensionId]
        .getEntities({
          type: EditableNpc.type,
        })
        .map(e => ({
          entity: e,
          npc: e.getDynamicProperty(EditableNpc.propertyName),
        })))

      const filteredNpcs = npcs.filter(e => e.npc === npc.id)
      console.debug({ filteredNpcs: filteredNpcs.length, npcs: npcs.length })
      if (filteredNpcs.length > 1) {
        console.debug('More then one')
        // More then one? Save only first one, kill others
        npc.entity = filteredNpcs.shift()?.entity
        filteredNpcs.forEach(e => e.entity.remove())
      } else {
        console.debug('Found one')
        //
        npc.entity = filteredNpcs[0]?.entity
      }

      // Cannot find, spawn
      if (!npc.entity) npc.spawn()
      // Apply nameTag etc
      else npc.setupNpc(npc.entity)
    })
  },
  'npc loading',
  20
)
