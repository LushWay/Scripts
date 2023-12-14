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
import { GAME_UTILS, util } from 'smapi.js'
import { WE_CONFIG, spawnParticlesInArea } from '../config.js'
import { Cuboid } from '../utils/cuboid.js'
import { Structure } from './Structure.js'

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
    this.visualSelectionCuboid = new Cuboid(
      this.selectionCuboid.min,
      Vector.add(this.selectionCuboid.max, Vector.one)
    )
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
   * @type {{pos1:Vector3; pos2:Vector3; name:string}}
   * @private
   */
  currentCopy = {
    pos1: Vector.one,
    pos2: Vector.one,
    name: '',
  }

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
    if (
      !this.drawselection ||
      !this.selectionCuboid ||
      !this.visualSelectionCuboid
    )
      return

    if (this.selectionCuboid.blocksBetween > WE_CONFIG.DRAW_SELECTION_MAX_SIZE)
      return

    spawnParticlesInArea(
      this.selectionCuboid.pos1,
      this.selectionCuboid.pos2,
      this.selectionCuboid
    )
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

      const e = util.ngettext(amount, [
        'сохранение',
        'сохранения',
        'сохранений',
      ])
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
      if (!this.selectionCuboid)
        return '§4► §cЗона для копирования не выделена!'

      const result = world.overworld.runCommand(
        `structure save ${WE_CONFIG.COPY_FILE_NAME} ${this.pos1.x} ${this.pos1.y} ${this.pos1.z} ${this.pos2.x} ${this.pos2.y} ${this.pos2.z} false memory`
      )
      if (!result)
        return `§4► §cНе удалось скопировать, вызов команды возвратил ошибку.`

      this.currentCopy = {
        pos1: this.pos1,
        pos2: this.pos2,
        name: WE_CONFIG.COPY_FILE_NAME,
      }
      return `§9► §fСкопированно из ${Vector.string(
        this.pos1
      )} в ${Vector.string(this.pos2)}`
    } catch (error) {
      util.error(error)
      return `§4► §cНе удалось скорпировать: ${error.message}`
    }
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
   * @returns {string}
   * @example paste(Player, 0, "none", false, true, 100.0, "");
   */
  paste(
    player,
    rotation = 0,
    mirror = 'none',
    includesEntites = false,
    includesBlocks = true,
    integrity = 100.0,
    seed = ''
  ) {
    try {
      const dx = Math.abs(this.currentCopy.pos2.x - this.currentCopy.pos1.x)
      const dy = Math.abs(this.currentCopy.pos2.y - this.currentCopy.pos1.y)
      const dz = Math.abs(this.currentCopy.pos2.z - this.currentCopy.pos1.z)
      const pos2 = Vector.add(player.location, new Vector(dx, dy, dz))

      const loc = Vector.floor(player.location)

      this.backup(loc, pos2)

      player.runCommand(
        `structure load ${WE_CONFIG.COPY_FILE_NAME} ~ ~ ~ ${String(
          rotation
        ).replace(
          'NaN',
          '0'
        )}_degrees ${mirror} ${includesEntites} ${includesBlocks} ${
          integrity ? integrity : ''
        } ${seed ? seed : ''}`
      )

      return `§a► §rВставлено в ${loc.x} ${loc.y} ${loc.z}`
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

    const timeForEachFill = 3
    const fillSize = 32768
    const time = Math.round(
      (this.selectionCuboid.blocksBetween / fillSize) * timeForEachFill * 0.05
    )
    if (time >= 0.01)
      player.tell(
        `§9► §rНачато заполнение, которое будет закончено приблизительно через ${time} сек`
      )
    const startTime = Date.now()
    this.backup()
    let errors = 0
    let all = 0

    /** @type {(import('modules/WorldEdit/menu.js').ReplaceTarget | undefined)[]} */
    const replaceTargets = replaceBlocks.map(e =>
      e && e instanceof BlockPermutation
        ? { typeId: e.type.id, states: e.getAllStates() }
        : e
    )

    // TODO use O(n) for blocks.length === 1
    for (const cube of Vector.foreach(
      this.selectionCuboid.min,
      this.selectionCuboid.max
    )) {
      for (const replaceBlock of replaceTargets) {
        try {
          const block = world.overworld.getBlock(cube)

          if (
            replaceBlock &&
            !block?.permutation.matches(
              replaceBlock.typeId,
              replaceBlock.states
            )
          )
            continue

          block?.setPermutation(toPermutation(blocks.randomElement()))
        } catch (e) {
          if (
            !(
              e instanceof LocationInUnloadedChunkError ||
              e instanceof LocationOutOfWorldBoundariesError
            ) &&
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

    let reply = `§3${errors ? 'всего' : 'Заполнено'} §f${
      this.selectionCuboid.blocksBetween
    } §3${util.ngettext(this.selectionCuboid.blocksBetween, [
      'блок',
      'блока',
      'блоков',
    ])}`
    if (endTime.parsedTime !== '0') {
      reply += ` за §f${endTime.parsedTime} §3${endTime.type}.`
    }
    if (replaceTargets.filter(Boolean).length) {
      reply += `§3, заполняет: §f${replaceTargets
        .map(e => e?.typeId && GAME_UTILS.toNameTag(e.typeId))
        .filter(Boolean)
        .join(', ')}`
    }

    if (errors) {
      player.playSound(SOUNDS.fail)
      return player.tell(
        `§4► §f${errors}/${all} §cошибок при заполнении, ${reply}`
      )
    }
    player.playSound(SOUNDS.success)
    player.tell(`§a► ${reply}`)
  }
}

system.runInterval(
  () => {
    for (const build of Object.values(WorldEdit.instances))
      build.drawSelection()
  },
  'we Selection',
  20
)
