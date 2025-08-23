import { BlockPermutation, Player, StructureMirrorAxis, StructureRotation, system, world } from '@minecraft/server'
import { Vec, ask, getRole, isLocationError } from 'lib'
import { Sounds } from 'lib/assets/custom-sounds'
import { table } from 'lib/database/abstract'
import { i18n } from 'lib/i18n/text'
import { stringify } from 'lib/utils/inspect'
import { createLogger } from 'lib/utils/logger'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { BigStructure } from '../../../lib/utils/big-structure'
import { Cuboid } from '../../../lib/utils/cuboid'
import { WE_CONFIG, spawnParticlesInArea } from '../config'
import {
  ReplaceMode,
  ReplaceTarget,
  replaceWithTargets,
  stringifyBlockWeights,
  toPermutation,
  toReplaceTarget,
} from '../utils/blocks-set'

// TODO Add WorldEdit.runMultipleAsyncJobs

interface WeDB {
  pos1: Vector3
  pos2: Vector3
}

export interface WeBackup {
  load(): void
  delete(): void
  name: string
  pos1?: Vector3
  pos2?: Vector3
  type?: (name: string) => WeBackup
}

const logger = createLogger('WorldEdit')

export class WorldEdit {
  static db = table<WeDB>('worldEdit', () => ({ pos1: { x: 0, y: 0, z: 0 }, pos2: { x: 0, y: 0, z: 0 } }))

  static forPlayer(player: Player) {
    const we = this.instances.get(player.id)
    return we ?? new WorldEdit(player)
  }

  static instances = new WeakPlayerMap<WorldEdit>({ removeOnLeave: false })

  static {
    system.runInterval(
      () => {
        for (const we of WorldEdit.instances.values()) we.drawSelection()
      },
      'we Selection',
      20,
    )
  }

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

      this.player.tell(`${color}►${pos}◄§r (${action}) ${Vec.string(this[`pos${pos}`])}`)
      this.player.playSound(Sounds.Success)
      this.updateSelectionCuboids()
    })
  }

  private updateSelectionCuboids() {
    if (!Vec.isValid(this.pos1) || !Vec.isValid(this.pos2)) return

    this.selection = new Cuboid(this.pos1, this.pos2)
    this.visualSelectionCuboid = new Cuboid(this.selection.min, Vec.add(this.selection.max, Vec.one))
  }

  history: WeBackup[] = []

  undos: WeBackup[] = []

  currentCopy: BigStructure | undefined

  private hasWarnAboutHistoryLimit = false

  private historyLimit = 100

  constructor(private player: Player) {
    this.db = WorldEdit.db.get(this.player.id)

    const we = WorldEdit.instances.get(player)
    if (we) return we

    WorldEdit.instances.set(player, this)
    this.updateSelectionCuboids()
  }

  /**
   * Logs an error message and tells the error to the player
   *
   * @param action - The `action` parameter represents the action that failed. It is a string that describes the action
   *   that was attempted but failed.
   * @param error - The `error` parameter is the error object or error message that occurred during the action. It can
   *   be either an Error object or a string representing the error message.
   */
  failedTo(action: string, error: unknown) {
    const text = stringify(error)
    if (!text) return

    logger.player(this.player).error`Failed to ${action}: ${error}`
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
   * @param name - Name of the backup. Used by undo/redo
   * @param pos1 Position 1 of cuboid location
   * @param pos2 Position 2 of cuboid location
   * @param history Save location where you want the to store your backup
   */
  backup(
    name: string,
    pos1: Vector3 = this.pos1,
    pos2: Vector3 = this.pos2,
    history: WeBackup[] = this.history,
    type?: WeBackup['type'],
  ) {
    if (history.length === this.historyLimit) {
      if (!this.hasWarnAboutHistoryLimit) {
        console.log('Player', this.player.name, 'has reached history limit (', this.historyLimit, ')')
        this.player.warn(
          `Вы превысили лимит отменяемых действий WorldEdit'а. Вы сможете восстановить лишь последние ${this.historyLimit} действий.`,
        )
        this.hasWarnAboutHistoryLimit = true
      }

      history[0]?.delete()
      history.splice(0, 1)
    }

    const structrure = type
      ? type(name)
      : new BigStructure(WE_CONFIG.BACKUP_PREFIX, pos1, pos2, this.player.dimension, name)

    history.push(structrure)
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

      this.player.info(`§3Успешно ${history === this.history ? 'отменено' : 'восстановлено'} §f${amount} §3действ!`)
    } catch (error) {
      this.failedTo('отменить', error)
    }
  }

  /** Loads backup and removes it from history */
  loadBackup(history: WeBackup[], backup: WeBackup) {
    this.backup(
      history === this.history ? 'Отмена (undo) ' + backup.name : 'Восстановление (redo) ' + backup.name,
      backup.pos1,
      backup.pos2,
      history === this.history ? this.undos : this.history,
      backup.type,
    )

    backup.load()

    // Remove backup from history
    history.splice(history.indexOf(backup), 1)
  }

  /**
   * Undoes the latest history save
   *
   * @param amount Times you want to undo
   */
  undo(amount = 1) {
    this.loadFromArray(amount, this.history)
  }

  /**
   * Redoes the latest history save
   *
   * @param amount Times you want to redo
   */
  redo(amount = 1) {
    this.loadFromArray(amount, this.undos)
  }

  /** Copies from the current selected positions */
  async copy() {
    try {
      const selection = await this.ensureSelection()
      if (!selection) return this.player.fail('Зона для копирования не выделена!')

      this.currentCopy = new BigStructure(
        WE_CONFIG.COPY_FILE_NAME + this.player.id,
        this.pos1,
        this.pos2,
        this.player.dimension,
      )
      this.player.info(
        `Скопирована область размером ${selection.size}\n§3От: ${Vec.string(this.pos1, true)}\n§3До: ${Vec.string(
          this.pos2,
          true,
        )}`,
      )
    } catch (error) {
      this.failedTo('скопировать', error)
    }
  }

  /** Parses paste positions, used by this.paste and by draw paste selection */
  pastePositions(rotation: StructureRotation, structure: BigStructure) {
    const dy = Math.abs(structure.pos2.y - structure.pos1.y)
    let dx = Math.abs(structure.pos2.x - structure.pos1.x)
    let dz = Math.abs(structure.pos2.z - structure.pos1.z)
    if (rotation === StructureRotation.Rotate270 || rotation === StructureRotation.Rotate90) [dx, dz] = [dz, dx]

    const pastePos1 = Vec.floor(this.player.location)
    const pastePos2 = Vec.add(pastePos1, { x: dx, y: dy, z: dz })

    return { pastePos1, pastePos2 }
  }

  /**
   * Pastes a copy from memory
   *
   * @example
   *   paste(Player, 0, 'none', false, true, 100.0, '')
   *
   * @param player Player to execute on
   * @param rotation Specifies the rotation when loading a structure
   * @param mirror Specifies the axis of mirror flip when loading a structure
   * @param includeEntities Specifies whether including entites or not
   * @param includeBlocks Specifies whether including blocks or not
   * @param integrity Specifies the integrity (probability of each block being loaded). If 100, all blocks in the
   *   structure are loaded.
   * @param integritySeed Specifies the seed when calculating whether a block should be loaded according to integrity.
   *   If unspecified, a random seed is taken.
   */
  async paste(
    rotation: StructureRotation = StructureRotation.None,
    mirror: StructureMirrorAxis = StructureMirrorAxis.None,
    includeEntities = false,
    includeBlocks = true,
    integrity?: number,
    integritySeed?: string,
  ) {
    try {
      if (!this.currentCopy) return this.player.fail('§cВы ничего не копировали!')
      const { pastePos1, pastePos2 } = this.pastePositions(rotation, this.currentCopy)

      this.backup('Вставка (paste)', pastePos1, pastePos2)
      await this.currentCopy.load(pastePos1, undefined, {
        rotation,
        mirror,
        includeEntities,
        includeBlocks,
        integrity,
        integritySeed,
      })

      this.player.success(`Успешно вставлено в ${Vec.string(pastePos1)}`)
    } catch (error) {
      this.failedTo('вставить', error)
    }
  }

  /** Ensures that selection matches max allow size */
  async ensureSelection() {
    const player = this.player
    if (!this.selection) return player.fail('§cЗона не выделена!')
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
        const result = await ask(
          player,
          `§6Внимание! §cВы уверены что хотите использовать выделенную область размером §f${this.selection.size}§c?`,
          'Да',
          () => true,
        )

        if (!result) return player.fail('§cОтменяем...')
      }
    }

    return this.selection
  }

  async fillBetween(
    blocks: (ReplaceTarget | BlockPermutation)[],
    replaceBlocks: (ReplaceTarget | BlockPermutation)[] = [],
    replaceMode: ReplaceMode,
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
      this.backup(`§3Заполнение области размером §f${selection.size} §3блоками §f${stringifyBlockWeights(blocks)}`)
      let errors = 0
      let all = 0

      const replaceTargets = replaceBlocks.map(toReplaceTarget)
      const permutations = blocks.map(toPermutation)
      const player = this.player

      system.runJob(
        (function* fillBetweenJob() {
          let i = 0
          for (const position of Vec.forEach(selection.min, selection.max)) {
            i++
            const block = world.overworld.getBlock(position)
            if (!block) continue

            try {
              replaceWithTargets(replaceTargets, replaceMode, block, permutations)
              if (i % 500 === 0) yield
            } catch (error) {
              if (errors < 3 && error instanceof Error) {
                player.fail(`Ошибка при заполнении (§f${errors}§c): §4${error.name} §f${error.message}`)
              }
              if (!isLocationError(error) && errors < 3) console.error(error)

              errors++
            } finally {
              all++
            }
          }
        })(),
      )

      let reply = `§3${errors ? 'всего' : 'Заполнено'} §f${selection.size} §3за ${i18n
        .restyle({ unit: '§f', text: '§3' })
        .time(Date.now() - startTime)
        .to(player.lang)}.`

      if (replaceTargets.filter(Boolean).length) {
        reply += `§3, заполняемые блоки: §f${stringifyBlockWeights(replaceTargets)}`
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
