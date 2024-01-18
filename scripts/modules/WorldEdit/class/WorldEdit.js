import {
  BlockPermutation,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Player,
  Vector,
  system,
  world,
} from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { toPermutation } from 'modules/WorldEdit/menu.js'
import { GAME_UTILS, is, util } from 'smapi.js'
import { WE_CONFIG, spawnParticlesInArea } from '../config.js'
import { Cuboid } from '../utils/cuboid.js'
import { Structure } from './Structure.js'

// TODO Undo/redo manage menu
// TODO Undo redo menu for any player
// TODO Force set when selection is big
export class WorldEdit {
  /**
   * @param {Player} player
   */
  static forPlayer(player) {
    if (player.id in this.instances) return this.instances[player.id]
    return new WorldEdit(player)
  }
  /** @type {Record<string, WorldEdit>} */
  static instances = {}

  drawselection = WE_CONFIG.DRAW_SELECTION_DEFAULT

  /**
   * @type {Cuboid | undefined}
   */
  selectionCuboid

  /**
   * @type {Cuboid | undefined}
   */
  visualSelectionCuboid

  recreateCuboids() {
    this.selectionCuboid = new Cuboid(this.#pos1, this.#pos2)
    this.visualSelectionCuboid = new Cuboid(this.selectionCuboid.min, Vector.add(this.selectionCuboid.max, Vector.one))
  }

  /**
   * @type {Vector3}
   */
  #pos1 = Vector.one
  /**
   * @type {Vector3}
   */
  #pos2 = Vector.one

  get pos1() {
    return this.#pos1
  }
  set pos1(value) {
    this.#pos1 = value
    this.recreateCuboids()
  }

  get pos2() {
    return this.#pos2
  }
  set pos2(value) {
    this.#pos2 = value
    this.recreateCuboids()
  }

  /**
   * @type {Structure[]}
   * @private
   */
  history = []

  /**
   * @type {Structure[]}
   * @private
   */
  undos = []

  /**
   * @type {Structure | undefined}
   */
  currentCopy

  /**
   * @type {Player}
   */
  player

  /**
   * @param {Player} player
   */
  constructor(player) {
    const id = player.id
    if (id in WorldEdit.instances) return WorldEdit.instances[id]
    WorldEdit.instances[id] = this
    this.player = player
    system.delay(() => {
      const event = world.afterEvents.playerLeave.subscribe(({ playerId }) => {
        if (playerId !== this.player.id) return

        world.afterEvents.playerLeave.unsubscribe(event)
        delete WorldEdit.instances[id]
      })
    })
  }

  drawSelection() {
    if (!this.drawselection || !this.selectionCuboid || !this.visualSelectionCuboid) return

    if (this.selectionCuboid.size > WE_CONFIG.DRAW_SELECTION_MAX_SIZE) return

    spawnParticlesInArea(this.visualSelectionCuboid.pos1, this.visualSelectionCuboid.pos2, this.visualSelectionCuboid)
  }

  /**
   * Backups a location
   * @param {Vector3} pos1 Position 1 of cuboid location
   * @param {Vector3} pos2 Position 2 of cuboid location
   * @param {Structure[]} saveLocation Save location where you want the data to store your backup
   * @example backup(pos1, pos2, history);
   */
  backup(pos1 = this.pos1, pos2 = this.pos2, saveLocation = this.history) {
    saveLocation.push(new Structure(WE_CONFIG.BACKUP_PREFIX, pos1, pos2))
  }

  /**
   * @private
   */
  loadFromArray(amount = 1, array = this.history) {
    try {
      // Max allowed amount is array length
      if (amount > array.length) amount = array.length

      const backups = array.slice(-amount)
      for (const backup of backups.reverse()) {
        this.backup(backup.pos1, backup.pos2, this.undos)
        backup.load()

        // Remove backup from history
        array.splice(array.indexOf(backup), 1)
      }

      const e = util.ngettext(amount, ['сохранение', 'сохранения', 'сохранений'])
      const o = amount.toString().endsWith('1') ? '' : 'о'

      return `§b► §3Успешно отменен${o} §f${amount} §3${e}!`
    } catch (error) {
      util.error(error)
      return `§4► §cНе удалось отменить: ${error.message}`
    }
  }

  /**
   * Undoes the latest history save
   * @param {number} amount times you want to undo
   * @returns {string}
   */
  undo(amount = 1) {
    return this.loadFromArray(amount, this.history)
  }
  /**
   * Redoes the latest history save
   * @param {number} amount times you want to redo
   * @returns {string}
   */
  redo(amount = 1) {
    return this.loadFromArray(amount, this.undos)
  }
  /**
   * Copys from the curret positions
   * @returns {string}
   */
  copy() {
    try {
      if (!this.selectionCuboid) return '§4► §cЗона для копирования не выделена!'

      this.currentCopy = new Structure(WE_CONFIG.COPY_FILE_NAME + this.player.id, this.pos1, this.pos2)
      return `§9► §fСкопирована область ${Vector.string(this.pos1)} - ${Vector.string(this.pos2)} размером ${
        this.selectionCuboid.size
      }`
    } catch (error) {
      util.error(error)
      return `§4► §cНе удалось скорпировать: ${error.message}`
    }
  }
  /**
   *
   * @param {Player} player
   * @param  {Parameters<WorldEdit['paste']>[1]} rotation
   * @param {NonNullable<WorldEdit['currentCopy']>} currentCopy
   */
  pastePositions(player, rotation, currentCopy) {
    let dx = Math.abs(currentCopy.pos2.x - currentCopy.pos1.x)
    const dy = Math.abs(currentCopy.pos2.y - currentCopy.pos1.y)
    let dz = Math.abs(currentCopy.pos2.z - currentCopy.pos1.z)
    if (rotation === 270 || rotation === 90) [dx, dz] = [dz, dx]

    const pastePos1 = Vector.floor(player.location)
    const pastePos2 = Vector.add(pastePos1, { x: dx, y: dy, z: dz })

    return { pastePos1, pastePos2 }
  }
  /**
   * Pastes a copy from memory
   * @param {Player} player player to execute on
   * @param {0 | 90 | 180 | 270} rotation Specifies the rotation when loading a structure
   * @param {"none" | "x" | "xz" | "z"} mirror Specifies the axis of mirror flip when loading a structure
   * @param {boolean} includesEntites Specifies whether including entites or not
   * @param {boolean} includesBlocks Specifies whether including blocks or not
   * @param {number} integrity Specifies the integrity (probability of each block being loaded). If 100, all blocks in the structure are loaded.
   * @param {string} seed Specifies the seed when calculating whether a block should be loaded according to integrity. If unspecified, a random seed is taken.
   * @example paste(Player, 0, "none", false, true, 100.0, "");
   */
  async paste(
    player,
    rotation = 0,
    mirror = 'none',
    includesEntites = false,
    includesBlocks = true,
    integrity = 100.0,
    seed = ''
  ) {
    try {
      if (!this.currentCopy) return '§4► §cВы ничего не копировали!'

      const { pastePos1, pastePos2 } = this.pastePositions(player, rotation, this.currentCopy)

      this.backup(pastePos1, pastePos2)

      try {
        await this.currentCopy.load(
          pastePos1,
          ` ${String(rotation).replace('NaN', '0')}_degrees ${mirror} ${includesEntites} ${includesBlocks} true ${
            integrity ? integrity : ''
          } ${seed ? seed : ''}`
        )
      } catch (e) {
        if (e instanceof Error) {
          player.tell(e.message)
        } else throw new Error(e)
      }

      return `§a► §rУспешно вставлено в ${Vector.string(pastePos1)}`
    } catch (error) {
      util.error(error)
      return `§4► §cНе удалось вставить: ${error.message}`
    }
  }
  /**
   * @param {Player} player
   * @param {(import('../menu.js').ReplaceTarget | BlockPermutation)[]} blocks
   * @param {(undefined | import('../menu.js').ReplaceTarget | BlockPermutation)[]} replaceBlocks
   */
  async fillBetween(player, blocks, replaceBlocks = [undefined]) {
    if (!this.selectionCuboid) return 'Зона не выделена!'
    const limit = is(player.id, 'admin') ? 100000 : is(player.id, 'moderator') ? 10000 : 1000
    if (this.selectionCuboid.size > limit) {
      return player.tell(`§cРазмер выделенной области превышает лимит §c(${this.selectionCuboid.size}/§f${limit}§c)`)
    }

    const timeForEachFill = 3
    const fillSize = 32768
    const time = Math.round((this.selectionCuboid.size / fillSize) * timeForEachFill * 0.05)
    if (time >= 0.01) player.tell(`§9► §rНачато заполнение, которое будет закончено приблизительно через ${time} сек`)
    const startTime = Date.now()
    this.backup()
    let errors = 0
    let all = 0

    /** @type {(import('modules/WorldEdit/menu.js').ReplaceTarget | undefined)[]} */
    const replaceTargets = replaceBlocks.map(e =>
      e && e instanceof BlockPermutation ? { typeId: e.type.id, states: e.getAllStates() } : e
    )

    nextBlock: for (const position of Vector.foreach(this.selectionCuboid.min, this.selectionCuboid.max)) {
      for (const replaceBlock of replaceTargets) {
        try {
          const block = world.overworld.getBlock(position)

          if (replaceBlock && !block?.permutation.matches(replaceBlock.typeId, replaceBlock.states)) continue

          block?.setPermutation(toPermutation(blocks.randomElement()))
          continue nextBlock
        } catch (e) {
          if (
            !(e instanceof LocationInUnloadedChunkError || e instanceof LocationOutOfWorldBoundariesError) &&
            errors < 3
          )
            util.error(e)

          errors++
        }

        all++
        await nextTick
      }
    }

    const endTime = util.ms.remaining(Date.now() - startTime, {
      timeTypes: ['ms', 'sec', 'min'],
    })

    let reply = `§3${errors ? 'всего' : 'Заполнено'} §f${this.selectionCuboid.size} §3${util.ngettext(
      this.selectionCuboid.size,
      ['блок', 'блока', 'блоков']
    )}`
    if (endTime.parsedTime !== '0') {
      reply += ` за §f${endTime.parsedTime} §3${endTime.type}.`
    }
    if (replaceTargets.filter(Boolean).length) {
      reply += `§3, заполняемые блоки: §f${replaceTargets
        .map(e => e?.typeId && GAME_UTILS.toNameTag(e.typeId))
        .filter(Boolean)
        .join(', ')}`
    }

    if (errors) {
      player.playSound(SOUNDS.fail)
      return player.tell(`§4► §c${errors}/§f${all}§c §cошибок при заполнении, ${reply}`)
    }
    player.playSound(SOUNDS.success)
    player.tell(`§a► ${reply}`)
  }
}

system.runInterval(
  () => {
    for (const build of Object.values(WorldEdit.instances)) build.drawSelection()
  },
  'we Selection',
  20
)
