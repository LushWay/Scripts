import { GameMode, LocationInUnloadedChunkError, MolangVariableMap, Player, system, world } from '@minecraft/server'
import 'lib/command'
import { Cooldown } from 'lib/cooldown'
import { table } from 'lib/database/abstract'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { form } from 'lib/form/new'
import { i18n, noI18n } from 'lib/i18n/text'
import { Region } from 'lib/region/kinds/region'
import { Vec } from 'lib/vector'
import { actionGuard, ActionGuardOrder } from '.'
import { SphereArea } from './areas/sphere'
import { regionForm } from './form'

export const regionTypes: { name: string; region: typeof Region; creatable: boolean; displayName: boolean }[] = []
export function registerRegionType(name: string, region: typeof Region, creatable = true, displayName = !creatable) {
  regionTypes.push({ name, region, creatable, displayName })
}

const command = new Command('region')
  .setDescription(i18n`Управляет регионами`)
  .setPermissions('techAdmin')
  .setGroup('public')
  .executes(regionForm.command)

command
  .overload('permdebug')
  .setPermissions('everybody')
  .setGroup('test')
  .executes(ctx => {
    Region.permissionDebug = !Region.permissionDebug
    ctx.reply(`Changed to ${Region.permissionDebug}`)
  })

// Region iterate tp
const tpform = form((f, { player }) => {
  f.title('regiontp')
  const db = getTpDb(player)
  if (!db) return

  for (const type of regionTypes) {
    const selected = db.type === type.name
    f.button((selected ? i18n.accent : i18n.disabled).join`${type.name}`.size(type.region.getAll().length), () => {
      db.type = type.name
      db.i = 0
      updateTpTitle(player)?.()
    })
  }
})
const tpdb = table<{ type: string; i: number; enabled: boolean }>('regionTpTest', () => ({
  type: '',
  i: 0,
  enabled: false,
}))
command
  .overload('tp')
  .setPermissions('techAdmin')
  .setDescription('Входит в режим телепортации по группе регионов. Полезно для поиска данжа')
  .setGroup('test')
  .executes(ctx => {
    const db = tpdb.get(ctx.player.id)
    db.enabled = !db.enabled
    if (!db.enabled) ctx.player.success('Выключено')
    else tpform.command(ctx)
  })

function getTpArray(id: string) {
  return regionTypes.find(e => e.name === id)?.region.getAll() ?? []
}

system.delay(() => {
  const cd = new Cooldown(1000, false, {})

  actionGuard((player, _, ctx) => {
    if (ctx.type !== 'interactWithBlock' && ctx.type !== 'interactWithEntity') return

    const db = getTpDb(player)
    if (!db) return

    if (!cd.isExpired(player)) return

    system.delay(() => {
      const array = getTpArray(db.type)
      if (player.isSneaking) db.i--
      else db.i++
      db.i = Math.min(array.length - 1, db.i, Math.max(0, db.i))

      updateTpTitle(player)?.()
    })

    return false
  }, ActionGuardOrder.BlockAction)
})

system.runPlayerInterval(updateTpTitle, 'region tp title', 20)

function getTpDb(player: Player) {
  if (!tpdb.has(player.id)) return

  const gm = player.getGameMode()
  if (gm === GameMode.Survival || gm === GameMode.Adventure) return

  const db = tpdb.get(player.id)
  if (!db.enabled) return

  return db
}

function updateTpTitle(player: Player) {
  const db = getTpDb(player)
  if (!db) return

  const array = getTpArray(db.type)
  const region = array[db.i]
  if (!region) return

  player.onScreenDisplay.setActionBar(
    noI18n`${region.displayName ?? region.name}\n${region.area.toString()}\n<- use | ${db.i + 1}/${array.length} | crouch & use ->`,
    ActionbarPriority.Highest,
  )

  return () => player.teleport(region.area.center, { dimension: region.dimension })
}

// Borders

const db = table<{ enabled: boolean }>('regionBorders', () => ({ enabled: false }))

command
  .overload('borders')
  .executes(ctx => ctx.player.tell(noI18n`Borders enabled: ${db.get(ctx.player.id).enabled}`))
  .boolean('toggle', true)
  .executes((ctx, newValue = !db.get(ctx.player.id).enabled) => {
    ctx.player.tell(noI18n`${db.get(ctx.player.id).enabled} -> ${newValue}`)
    ctx.player.database
    db.get(ctx.player.id).enabled = newValue
  })

const variables = new MolangVariableMap()
variables.setColorRGBA('color', { red: 0, green: 1, blue: 0, alpha: 0 })

system.runInterval(
  () => {
    if (!db.values().some(e => e.enabled)) return
    const players = world.getAllPlayers()

    for (const region of Region.getAll()) {
      if (!(region.area instanceof SphereArea)) continue

      const playersNearRegion = players.filter(e => region.area.isNear(e, 30))
      if (!playersNearRegion.length) continue

      let skip = 0
      region.area.forEachVector((vector, isIn) => {
        skip++
        if (skip % 2 === 0) return
        if (!Region.getAll().includes(region)) return // deleted

        try {
          const r = Vec.distance(region.area.center, vector)
          if (isIn && r > region.area.radius - 1) {
            for (const player of playersNearRegion) {
              if (!player.isValid) continue
              if (!db.get(player.id).enabled) continue

              player.spawnParticle('minecraft:wax_particle', vector, variables)
            }
          }
        } catch (e) {
          if (e instanceof LocationInUnloadedChunkError) return
          throw e
        }
      }, 100)
    }
  },
  'region borders',
  40,
)
