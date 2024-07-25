import { Player } from '@minecraft/server'
import { ArrayForm } from 'lib'
import { playerJson } from 'lib/assets/player-json'

new Command('props')
  .setDescription('Player properties menu')
  .setPermissions('techAdmin')
  .executes(ctx => propsMenu(ctx.player))

const properties = playerJson['minecraft:entity'].description.properties
type Prop = ValueOf<typeof properties>

function propsMenu(player: Player) {
  new ArrayForm('Properties', Object.entries(properties))
    .button(([id, prop]) => {
      const current = player.getProperty(id)
      return [`${id} §7${current}`, () => propMenu(prop, current, player, id)]
    })
    .show(player)
}

function propMenu(prop: Prop, current: string | number | boolean | undefined, player: Player, id: string) {
  new ArrayForm<string | boolean>('Choose value', prop.type === 'enum' ? prop.values : [true, false])
    .button(value => [
      `${value === current ? '§a>§7 ' : '§f'}${value.toString()}`,
      () => {
        player.setProperty(id, value)
        propMenu(prop, value, player, id)
      },
    ])
    .back(() => propsMenu(player))
    .show(player)
}
