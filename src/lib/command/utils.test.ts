import { TEST_createPlayer } from 'test/utils'
import { commandNotFound } from './utils'

beforeEach(() => (Command.commands = []))
afterEach(() => (Command.commands = []))

describe('command utils', () => {
  it('should suggest commands', () => {
    new Command('abc').setPermissions('everybody')
    new Command('bbc').setPermissions('everybody')
    new Command('bbd').setPermissions('everybody')
    new Command('bbe').setPermissions('everybody')
    new Command('bbf').setPermissions('everybody')
    new Command('somecmd').setPermissions('everybody')
    new Command('kill').setPermissions('everybody')
    new Command('smert').setPermissions('everybody')

    const player = TEST_createPlayer()
    const tell = vi.spyOn(player, 'tell')
    vi.spyOn(console, 'warn').mockImplementationOnce(() => {})
    commandNotFound(player, 'bbb')
    expect(tell.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "§cВы имели ввиду §f§fbbc (50%%)§c, §fbbd (50%%)§c или §fbbe (50%%)§c§c?",
        ],
        [
          "§cСписок всех доступных вам команд: §f.help",
        ],
      ]
    `)
  })
})

