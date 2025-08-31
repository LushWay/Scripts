import { GameMode, Player, PlayerDatabase, ScoreNames, ShortcutDimensions, system, world } from '@minecraft/server'
import {
  Airdrop,
  ArrayForm,
  BUTTON,
  Compass,
  InventoryStore,
  is,
  Join,
  ModalForm,
  pick,
  scoreboardObjectiveNames,
  sizeOf,
} from 'lib'
import { table } from 'lib/database/abstract'
import { form, NewFormCallback, NewFormCreator } from 'lib/form/new'
import { i18n, noI18n } from 'lib/i18n/text'
import { Quest } from 'lib/quest'
import { enterNewbieMode, isNewbie } from 'lib/rpg/newbie'
import { Anarchy } from 'modules/places/anarchy/anarchy'
import { Spawn } from 'modules/places/spawn'
import { updateBuilderStatus } from 'modules/world-edit/builder'

type RestorePointRef = [owner: string, name: string]

declare module '@minecraft/server' {
  interface PlayerDatabase {
    /* Latest restore point player loaded into */
    restorePoint?: RestorePointRef
  }
}

interface RestorePoint {
  name: string
  parent?: RestorePointRef
  location: Vector3
  dimensionType: ShortcutDimensions
  scores: Pick<Player['scores'], 'money' | 'anarchyOnlineTime' | ScoreNames.GameModesStat>
  db: Pick<PlayerDatabase, 'inv' | 'survival' | 'unlockedPortals' | 'quests' | 'achivs'>
}

interface RestorePointLoadLog {
  playerName: string
  date: number
  pointId: string
}

interface DB {
  restorePoints: Record<string, RestorePoint>
  loads: RestorePointLoadLog[]
}

const db = table<DB>('wipe', () => ({ restorePoints: {}, loads: [] }))
const wipeInventoryDatabase = new InventoryStore('testWipeRestorePoints')

function generateId(name: string) {
  const date = new Date()
  return `${name} | ${date.toHHMM()} ${date.toYYYYMMDD()}`
}

function createRestorePoint(player: Player, name: string, id = generateId(name)) {
  player.info('Creating restore point...')

  try {
    if (player.database.inv !== 'anarchy') {
      return player.fail(i18n.error`Вы не можете создать точку восстановления не находясь на анархии`)
    }

    if (![GameMode.Adventure, GameMode.Survival].includes(player.getGameMode())) {
      return player.fail(i18n.error`Вы не можете создать точку восстановления не находясь в выживании или приключении`)
    }

    const playerDb = db.get(player.id)
    playerDb.restorePoints[id] = {
      name,
      parent: player.database.restorePoint,
      location: player.location,
      dimensionType: player.dimension.type,
      scores: pick(player.scores, ['money', 'anarchyOnlineTime', ...scoreboardObjectiveNames.gameModeStats]),
      db: pick(player.database, ['inv', 'survival', 'unlockedPortals', 'quests', 'achivs']),
    }
    wipeInventoryDatabase.saveFrom(player, {
      rewrite: true,
      key: id,
      keepInventory: true,
    })
    player.success(i18n`Restore point ${id} created`)
  } catch (e) {
    player.fail(i18n.error`Creating restore point failed.`)
    console.error(e)
  }
}

function getRestorePointByRef([ownerId, id]: RestorePointRef) {
  return db.get(ownerId).restorePoints[id]
}

function loadRestorePoint(player: Player, [ownerId, id]: RestorePointRef) {
  const point = getRestorePointByRef([ownerId, id])
  if (!point) throw new Error(`No restore point found in db for id ${id}`)

  exitFromAllQuests(player)

  Object.assign(player.database, point.db)
  Object.assign(player.scores, point.scores)

  if (isNewbie(player)) enterNewbieMode(player, false)

  player.teleport(point.location, { dimension: world[point.dimensionType] })
  InventoryStore.load({
    to: player,
    from: wipeInventoryDatabase.get(id, { remove: false }),
  })
  player.database.restorePoint = [player.id, id]
  player.success(i18n`Restore point ${id} loaded.`)
}

new Command('wipe')
  .setAliases('save')
  .setDescription(i18n`Очищает и сохраняет все данные (для тестов)`)
  .setPermissions('everybody')
  .executes(ctx => {
    const player = ctx.player
    form(f => {
      f.title(i18n`Сохранения`)
      f.body(i18n`Точки восстановления, нужные для тестирования\n\n§cЭНДЕР СУНДУК НЕ СОХРАНЯЕТСЯ`)

      f.ask(
        i18n.error`Полный сброс`,
        i18n`Вы уверены, что хотите очистить инвентарь анархии и вернуться на спавн? Полезно для тестирования обучения.`,
        () => wipe(player),
      )

      f.button(i18n`Создать точку восстановления`, BUTTON['+'], () => {
        new ModalForm(i18n`Создать точку восстановления`.to(player.lang))
          .addTextField(
            i18n`§cЭНДЕР СУНДУК НЕ СОХРАНЯЕТСЯ\n\n§f\nСохраняются:\nПозиция в мирe\nЗадания\nИнвентарь\nОпыт\nМонеты\nСтатистика\nНазвание точки восстановления:`.to(
              player.lang,
            ),
            '',
          )
          .show(player, (ctx, name) => {
            const id = generateId(name)
            if (db.get(player.id).restorePoints[id])
              return ctx.error(
                noI18n.error`Restore point ${id} already exists. Other existing points:\n${Object.keys(
                  db.get(player.id).restorePoints,
                ).join('\n')}`,
              )

            createRestorePoint(player, name)
          })
      })

      f.button(i18n`Точки восстановления других игроков`, otherPlayerRestorePoints)

      const playerDb = db.get(player.id)
      renderList(f, playerDb, player.id, player)
    }).show(player)
  })

function otherPlayerRestorePoints(player: Player, back?: NewFormCallback) {
  const players = db.entries().filter(e => e[0] !== player.id)
  new ArrayForm('Other players', players)
    .back(back)
    .button(([ownerId, db]) => {
      const title = i18n`${Player.name(ownerId) ?? ownerId} (${sizeOf(db.restorePoints)})`
      return [
        title,
        form(f => {
          f.title(title)
          renderList(f, db, ownerId, player)
        }).show,
      ]
    })
    .show(player)
}

function renderList(f: NewFormCreator, source: DB, sourceOwnerId: string, player: Player) {
  for (const [id, restorePoint] of Object.entries(source.restorePoints)) {
    const logs = source.loads.filter(e => e.pointId === id)

    f.button(
      `${restorePoint.name.replaceAll('\n', '')}\n${id.split(' | ').at(-1)}`,
      restorePointMenu(player, [sourceOwnerId, id], restorePoint),
    )
  }
}

function restorePointMenu(player: Player, [ownerId, id]: RestorePointRef, restorePoint: RestorePoint) {
  return form(f => {
    const isOwner = ownerId === player.id
    f.title(restorePoint.name)
    f.body(id)

    if (isOwner) {
      f.ask(i18n`Перезаписать`, i18n`Перезаписать точку восстановления`, () => {
        createRestorePoint(player, restorePoint.name, id)
      })
    }

    f.ask(i18n`Загрузиться`, i18n`Загрузиться`, () => {
      loadRestorePoint(player, [ownerId, id])
    })
    if (is(player.id, 'techAdmin')) f.button('Log to the console', () => console.log(JSON.stringify(restorePoint)))
    f.ask(i18n.error`Удалить`, i18n`удалить точку`, () => {
      Reflect.deleteProperty(db.get(player.id).restorePoints, id)
    })
  })
}

function wipe(player: Player) {
  player.setGameMode(GameMode.Survival)
  updateBuilderStatus(player)

  exitFromAllQuests(player)
  delete player.database.quests
  delete player.database.achivs
  delete player.database.restorePoint

  Compass.setFor(player, undefined)
  Airdrop.instances.filter(a => a.for === player.id).forEach(a => a.delete())

  player.scores.money = 0
  player.scores.raid = 0
  player.scores.pvp = 0
  player.scores.anarchyOnlineTime = 0

  delete player.database.survival.anarchy
  delete player.database.survival.deadAt2
  delete player.database.survival.gravestoneId
  delete player.database.survival.newbie
  delete player.database.survival.rtpElytra

  Anarchy.inventoryStore.remove(player.id)
  Spawn.loadInventory(player)
  Spawn.portal?.teleport(player)

  enterNewbieMode(player)

  for (let i = 0; i <= 26; i++) player.runCommand(`replaceitem entity @s slot.enderchest ${i} air`)

  system.runTimeout(() => Join.emitFirstJoin(player), 'clear', 30)
}

function exitFromAllQuests(player: Player) {
  player.database.quests?.active.forEach(e => Quest.quests.get(e.id)?.exit(player))
}
