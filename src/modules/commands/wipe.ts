import { GameMode, Player, PlayerDatabase, ScoreNames, ShortcutDimensions, system, world } from '@minecraft/server'
import { Airdrop, BUTTON, Compass, InventoryStore, is, Join, ModalForm, pick, scoreboardObjectiveNames } from 'lib'
import { table } from 'lib/database/abstract'
import { form, NewFormCreator } from 'lib/form/new'
import { Quest } from 'lib/quest'
import { t } from 'lib/text'
import { Anarchy } from 'modules/places/anarchy/anarchy'
import { Spawn } from 'modules/places/spawn'
import { enterNewbieMode } from 'modules/pvp/newbie'
import { updateBuilderStatus } from 'modules/world-edit/builder'

interface RestorePoint {
  name: string
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
  restorePoints: Record<string, undefined | RestorePoint>
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
      return player.fail('Вы не можете создать точку восстановления не находясь на анархии')
    }

    if (![GameMode.adventure, GameMode.survival].includes(player.getGameMode())) {
      return player.fail('Вы не можете создать точку восстановления не находясь в выживании или приключении')
    }

    const playerDb = db.get(player.id)
    playerDb.restorePoints[id] = {
      name,
      location: player.location,
      dimensionType: player.dimension.type,
      scores: pick(player.scores, ['money', 'anarchyOnlineTime', ...scoreboardObjectiveNames.gameModeStats]),
      db: pick(player.database, ['inv', 'survival', 'unlockedPortals', 'quests', 'achivs']),
    }
    wipeInventoryDatabase.saveFrom(player, { rewrite: true, key: id, keepInventory: true })
    player.success(t`Restore point ${id} created`)
  } catch (e) {
    player.fail(t.error`Creating restore point failed.`)
    console.error(e)
  }
}

function loadRestorePoint(player: Player, id: string) {
  const point = db.get(player.id).restorePoints[id]
  if (!point) throw new Error('No restore point found in db for id ' + id)

  Object.assign(player.database, point.db)
  Object.assign(player.scores, point.scores)
  player.teleport(point.location, { dimension: world[point.dimensionType] })
  InventoryStore.load({ to: player, from: wipeInventoryDatabase.get(id, { remove: false }) })
  player.success(t`Restore point ${id} loaded.`)
}

new Command('wipe')
  .setAliases('save')
  .setDescription('Очищает и сохраняет все данные (для тестов)')
  .setPermissions('tester')
  .executes(ctx => {
    const player = ctx.player
    form(f => {
      f.title('Сохранения')
      f.body('Точки восстановления, нужные для тестирования\n\n§cЭНДЕР СУНДУК НЕ СОХРАНЯЕТСЯ')

      f.ask(
        '§cПолный сброс',
        'Вы уверены, что хотите очистить инвентарь анархии и вернуться на спавн? Полезно для тестирования обучения.',
        () => wipe(player),
      )

      f.button('Создать точку восстановления', BUTTON['+'], () => {
        new ModalForm('Создать точку восстановления')
          .addTextField(
            '§cЭНДЕР СУНДУК НЕ СОХРАНЯЮТСЯ\n\n§f\nСохраняются:\nПозиция в мире\nЗадания\nИнвентарь\nОпыт\nМонеты\nСтатистика\nНазвание точки восстановления:',
            '',
          )
          .show(player, (ctx, name) => {
            const id = generateId(name)
            if (db.get(player.id).restorePoints[id])
              return ctx.error(
                t.error`Restore point ${id} already exists. Other existing points:\n${Object.keys(db.get(player.id).restorePoints).join('\n')}`,
              )

            createRestorePoint(player, name)
          })
      })

      const source = db.get(player.id)
      renderList(f, source, player)
    }).show(player)
  })

function renderList(f: NewFormCreator, source: DB, player: Player) {
  for (const [id, restorePoint] of Object.entries(source.restorePoints)) {
    if (!restorePoint) continue
    const logs = source.loads.filter(e => e.pointId === id)

    f.button(
      restorePoint.name.replaceAll('\n', '') + '\n' + id.split(' | ').at(-1),
      restorePointMenu(player, id, restorePoint),
    )
  }
}

function restorePointMenu(player: Player, id: string, restorePoint: RestorePoint) {
  return form(f => {
    f.title(restorePoint.name)
    f.body(id)
    f.ask('Перезаписать', 'Перезаписать точку восстановления', () => {
      createRestorePoint(player, restorePoint.name, id)
    })
    f.ask('Загрузиться', 'Загрузиться', () => {
      loadRestorePoint(player, id)
    })
    if (is(player.id, 'techAdmin')) f.button('Log to the console', () => console.log(JSON.stringify(restorePoint)))
    f.ask('§cУдалить', 'удалить точку', () => {
      Reflect.deleteProperty(db.get(player.id).restorePoints, id)
    })
  })
}

function wipe(player: Player) {
  player.setGameMode(GameMode.survival)
  updateBuilderStatus(player)

  delete player.database.survival.rtpElytra

  player.database.quests?.active.forEach(e => Quest.quests.get(e.id)?.exit(player))
  delete player.database.quests
  delete player.database.achivs

  Compass.setFor(player, undefined)
  Airdrop.instances.filter(a => a.for === player.id).forEach(a => a.delete())

  player.scores.money = 0
  player.scores.raid = 0
  player.scores.pvp = 0
  player.scores.anarchyOnlineTime = 0

  delete player.database.survival.anarchy
  delete player.database.survival.deadAt
  delete player.database.survival.gravestoneId
  delete player.database.survival.newbie
  delete player.database.survival.rtpElytra

  Anarchy.inventoryStore.remove(player.id)
  Spawn.loadInventory(player)
  Spawn.portal?.teleport(player)

  enterNewbieMode(player)

  for (let i = 0; i <= 26; i++) {
    player.runCommand(`replaceitem entity @s slot.enderchest ${i} air`)
  }

  system.runTimeout(() => Join.emitFirstJoin(player), 'clear', 30)
}
