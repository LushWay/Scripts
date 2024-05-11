import {
  BlockPermutation,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Player,
  Vector,
  system,
  world,
} from '@minecraft/server'
import { getRole, prompt, util } from 'lib'
import { SOUNDS } from 'lib/assets/config'
import { table } from 'lib/database/abstract'
import { stringifyReplaceTargets, toPermutation, toReplaceTarget } from 'modules/world-edit/menu'
import { WE_CONFIG, spawnParticlesInArea } from '../config'
import { Cuboid } from './Cuboid'
import { Structure } from './Structure'

type WeDB = {
  pos1: Vector3
  pos2: Vector3
}

export class WorldEdit {
  static db = table<WeDB>('worldEdit')

  static forPlayer(player: Player) {
    if (player.id in this.instances) return this.instances[player.id]
    return new WorldEdit(player)
  }

  static instances: Record<string, WorldEdit> = {}

  selection: Cuboid | undefined

  visualSelectionCuboid: Cuboid | undefined

  db: WeDB

  get pos1() {
    return this.db.pos1
  }

  set pos1(value) {
    this.db.pos1 = { x: value.x, y: value.y, z: value.z }
    this.onPosChange(1)
  }

  get pos2() {
    return this.db.pos2
  }

  set pos2(value) {
    this.db.pos2 = { x: value.x, y: value.y, z: value.z }
    this.onPosChange(2)
  }

  private onPosChange(pos: 1 | 2) {
    system.delay(() => {
      const action = { 1: 'break', 2: 'use' }[pos]

      const color = { 1: '§5', 2: '§d' }[pos]

      this.player.tell(`${color}►${pos}◄§r (${action}) ${Vector.string(this[`pos${pos}`])}`)
      this.player.playSound(SOUNDS.action)
      this.updateSelectionCuboids()
    })
  }

  private updateSelectionCuboids() {
    if (!Vector.valid(this.pos1) || !Vector.valid(this.pos2)) return

    this.selection = new Cuboid(this.pos1, this.pos2)
    this.visualSelectionCuboid = new Cuboid(this.selection.min, Vector.add(this.selection.max, Vector.one))
  }

  history: Structure[] = []

  undos: Structure[] = []

  currentCopy: Structure | undefined

  private hasWarnAboutHistoryLimit = false

  private historyLimit = 100

  constructor(private player: Player) {
    const id = player.id

    if (id in WorldEdit.instances) return WorldEdit.instances[id]

    WorldEdit.instances[id] = this

    let db = WorldEdit.db[this.player.id]
    if (!db) {
      db = { pos1: Vector.one, pos2: Vector.one }

      WorldEdit.db[this.player.id] = db
    }

    this.db = db
    this.updateSelectionCuboids()
  }

  /**
   * Logs an error message and tells the error to the player
   *
   * @param {string} action - The `action` parameter represents the action that failed. It is a string that describes
   *   the action that was attempted but failed.
   * @param {any} error - The `error` parameter is the error object or error message that occurred during the action. It
   *   can be either an Error object or a string representing the error message.
   */

  failedTo(action: string, error: any) {
    const text = util.error(error, { parseOnly: true })
    if (!text) return
    console.error(text)
    this.player.fail(`Не удалось ${action}§f: ${error}`)
  }

  drawSelection() {
    if (!this.selection || !this.visualSelectionCuboid) return
    if (this.selection.size > WE_CONFIG.DRAW_SELECTION_MAX_SIZE) return

    spawnParticlesInArea(this.visualSelectionCuboid.pos1, this.visualSelectionCuboid.pos2, this.visualSelectionCuboid)
  }

  /**
   * Backups a location
   *
   * @param {string} name - Name of the backup. Used by undo/redo
   * @param {Vector3} pos1 Position 1 of cuboid location
   * @param {Vector3} pos2 Position 2 of cuboid location
   * @param {Structure[]} history Save location where you want the to store your backup
   */

  async backup(
    name: string,
    pos1: Vector3 = this.pos1,
    pos2: Vector3 = this.pos2,
    history: Structure[] = this.history,
  ) {
    if (this.history.length === this.historyLimit) {
      console.log('Player', this.player.name, 'has reached history limit (', this.historyLimit, ')')
      if (this.hasWarnAboutHistoryLimit) {
        this.player.warn(
          `Вы превысили лимит отменяемых действий WorldEdit'а. Вы сможете восстановить лишь последние ${this.historyLimit} действий.`,
        )
        this.hasWarnAboutHistoryLimit = true
      }

      this.player.runCommand(`structure delete ${history[0].id}`)
      history.splice(0, 1)
    }

    const structrure = new Structure(WE_CONFIG.BACKUP_PREFIX, pos1, pos2, name)

    history.push(structrure)
    await structrure.savePromise
  }

  /** Loads specified amount of backups from history array */
  private loadFromArray(amount = 1, history = this.history) {
    try {
      // Max allowed amount is array length
      if (amount > history.length) amount = history.length

      const historyToLoadNow = history.slice(-amount)
      if (historyToLoadNow.length < 1) {
        return this.player.fail('Нечего отменять!')
      }

      for (const backup of historyToLoadNow.slice().reverse()) {
        this.loadBackup(history, backup)
      }

      this.player.info(
        `§3Успешно отменено §f${amount} §3${util.ngettext(amount, ['действие', 'действия', 'действий'])}!`,
      )
    } catch (error) {
      this.failedTo('отменить', error)
    }
  }

  /**
   * Loads backup and removes it from history
   *
   * @param {Structure[]} history
   * @param {Structure} backup
   */

  loadBackup(history: Structure[], backup: Structure) {
    this.backup(
      history === this.history ? 'Отмена (undo) ' + backup.name : 'Восстановление (redo) ' + backup.name,
      backup.pos1,
      backup.pos2,
      this.undos,
    )

    backup.load()

    // Remove backup from history
    history.splice(history.indexOf(backup), 1)
  }

  /**
   * Undoes the latest history save
   *
   * @param {number} amount Times you want to undo
   */
  undo(amount: number = 1) {
    this.loadFromArray(amount, this.history)
  }

  /**
   * Redoes the latest history save
   *
   * @param {number} amount Times you want to redo
   */
  redo(amount: number = 1) {
    this.loadFromArray(amount, this.undos)
  }

  /** Copies from the current selected positions */
  async copy() {
    try {
      const selection = await this.ensureSelection()
      if (!selection) return

      this.currentCopy = new Structure(WE_CONFIG.COPY_FILE_NAME + this.player.id, this.pos1, this.pos2)
      await this.currentCopy.savePromise
      this.player.info(
        `Скопирована область размером ${selection.size}\n§3От: ${Vector.string(this.pos1, true)}\n§3До: ${Vector.string(
          this.pos2,
          true,
        )}`,
      )
    } catch (error) {
      this.failedTo('скопировать', error)
    }
  }

  /**
   * Parses paste positions, used by this.paste and by draw paste selection
   *
   * @param {Parameters<WorldEdit['paste']>[1]} rotation
   * @param {NonNullable<WorldEdit['currentCopy']>} currentCopy
   */

  pastePositions(rotation: Parameters<WorldEdit['paste']>[1], currentCopy: NonNullable<WorldEdit['currentCopy']>) {
    let dx = Math.abs(currentCopy.pos2.x - currentCopy.pos1.x)
    const dy = Math.abs(currentCopy.pos2.y - currentCopy.pos1.y)
    let dz = Math.abs(currentCopy.pos2.z - currentCopy.pos1.z)
    if (rotation === 270 || rotation === 90) [dx, dz] = [dz, dx]

    const pastePos1 = Vector.floor(this.player.location)
    const pastePos2 = Vector.add(pastePos1, { x: dx, y: dy, z: dz })

    return { pastePos1, pastePos2 }
  }

  /**
   * Pastes a copy from memory
   *
   * @example
   *   paste(Player, 0, 'none', false, true, 100.0, '')
   *
   * @param {Player} player Player to execute on
   * @param {0 | 90 | 180 | 270} rotation Specifies the rotation when loading a structure
   * @param {'none' | 'x' | 'xz' | 'z'} mirror Specifies the axis of mirror flip when loading a structure
   * @param {boolean} includesEntites Specifies whether including entites or not
   * @param {boolean} includesBlocks Specifies whether including blocks or not
   * @param {number} integrity Specifies the integrity (probability of each block being loaded). If 100, all blocks in
   *   the structure are loaded.
   * @param {string} seed Specifies the seed when calculating whether a block should be loaded according to integrity.
   *   If unspecified, a random seed is taken.
   */
  async paste(
    player: Player,
    rotation: 0 | 90 | 180 | 270 = 0,
    mirror: 'none' | 'x' | 'xz' | 'z' = 'none',
    includesEntites: boolean = false,
    includesBlocks: boolean = true,
    integrity: number = 100.0,
    seed: string = '',
  ) {
    try {
      if (!this.currentCopy) return this.player.fail('§cВы ничего не копировали!')

      const { pastePos1, pastePos2 } = this.pastePositions(rotation, this.currentCopy)

      try {
        await this.backup('Вставка (paste)', pastePos1, pastePos2)
        await this.currentCopy.load(
          pastePos1,
          ` ${String(rotation).replace('NaN', '0')}_degrees ${mirror} ${includesEntites} ${includesBlocks} true ${
            integrity ? integrity : ''
          } ${seed ? seed : ''}`,
        )
      } catch (e) {
        if (e instanceof Error) {
          player.fail(e.message)
        } else throw new Error(e)
      }

      this.player.success(`Успешно вставлено в ${Vector.string(pastePos1)}`)
    } catch (error) {
      this.failedTo('вставить', error)
    }
  }

  /** Ensures that selection matches max allow size */
  async ensureSelection() {
    const player = this.player
    if (!this.selection) return player.fail('§cЗона не выделена!')
    /** @type {Partial<Record<Role, number>>} */
    const limits: Partial<Record<Role, number>> = {
      builder: 10000,
      admin: 10000,
      grandBuilder: 100000,
      chefAdmin: 100000,
      techAdmin: 1000000,
    }

    const limit = limits[getRole(player.id)]
    if (typeof limit === 'number') {
      if (this.selection.size > limit) {
        return player.fail(`§cРазмер выделенной области превышает лимит §c(${this.selection.size}/§f${limit}§c)`)
      }
    } else {
      if (this.selection.size > 10000) {
        const result = await prompt(
          player,
          `§6Внимание! §cВы уверены что хотите использовать выделенную область размером §f${this.selection.size}§c?`,
          'Да',
          () => {},
        )

        if (!result) return player.fail('§cОтменяем...')
      }
    }

    return this.selection
  }

  /**
   * @param {(import('../menu').ReplaceTarget | BlockPermutation)[]} blocks
   * @param {(undefined | import('../menu').ReplaceTarget | BlockPermutation)[]} replaceBlocks
   */

  async fillBetween(
    blocks: (import('../menu').ReplaceTarget | BlockPermutation)[],
    replaceBlocks: (undefined | import('../menu').ReplaceTarget | BlockPermutation)[] = [undefined],
  ) {
    try {
      const selection = await this.ensureSelection()
      if (!selection) return

      const timeForEachFill = 1.5
      const fillSize = 32768
      const time = Math.round((selection.size / fillSize) * timeForEachFill)
      if (time >= 0.01) {
        this.player.info(`Начато заполнение, которое будет закончено приблизительно через ${time} сек`)
      }

      const startTime = Date.now()
      this.backup(
        `§3Заполнение области размером §f${selection.size} §3блоками §f${stringifyReplaceTargets(
          blocks.map(toReplaceTarget),
        )}`,
      )
      let errors = 0
      let all = 0

      const replaceTargets = replaceBlocks.map(toReplaceTarget)

      nextBlock: for (const position of Vector.foreach(selection.min, selection.max)) {
        for (const replaceBlock of replaceTargets) {
          try {
            const block = world.overworld.getBlock(position)

            if (replaceBlock && !block?.permutation.matches(replaceBlock.typeId, replaceBlock.states)) continue

            block?.setPermutation(toPermutation(blocks.randomElement()))
            continue nextBlock
          } catch (e) {
            if (errors < 3 && e instanceof Error) {
              this.player.fail(`Ошибка при заполнении (§f${errors}§c): §4${e.name} §f${e.message}`)
            }

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
        converters: ['ms', 'sec', 'min'],
      })

      let reply = `§3${errors ? 'всего' : 'Заполнено'} §f${selection.size} §3${util.ngettext(selection.size, [
        'блок',
        'блока',
        'блоков',
      ])}`
      if (endTime.value !== '0') {
        reply += ` за §f${endTime.value} §3${endTime.type}.`
      }
      if (replaceTargets.filter(Boolean).length) {
        reply += `§3, заполняемые блоки: §f${stringifyReplaceTargets(replaceTargets)}`
      }

      if (errors) {
        this.player.fail(`§c${errors}/§f${all}§c §cошибок при заполнении, ${reply}`)
      } else {
        this.player.success(reply)
      }
    } catch (error) {
      this.failedTo('заполнить', error)
    }
  }
}

system.runInterval(
  () => {
    for (const build of Object.values(WorldEdit.instances)) build.drawSelection()
  },
  'we Selection',
  20,
)
