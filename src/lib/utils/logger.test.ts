import { util } from 'lib'
import { TEST_createPlayer } from 'test/utils'
import { createLogger } from './logger'

describe('Logger', () => {
  it('should create logger that prints debug info', () => {
    const mock = vi.fn()
    const player = TEST_createPlayer()
    const logger = createLogger('name')
    vi.spyOn(console, 'debug').mockImplementation((...args) =>
      mock(util.fromTerminalColorsToMinecraft(util.format(args))),
    )

    logger.debug('Message Common')
    logger.debug('Message Common with arguments', [{ someObject: true }])
    logger.debug`Message Template`
    logger.player(player).debug('Player message Common')
    logger.player(player).debug`Message Template`

    expect(mock.mock.calls.flat().join('\n')).toMatchInlineSnapshot(`
      "§9name§r Message Common§r
      §9name§r Message Common with arguments§r [
        {
          someObject: §6true§r
        }
      ]§r
      §9name§r §fMessage Template§r
      §9name §f§lTest player name§r §r Player message Common§r
      §9name §f§lTest player name§r §r §fMessage Template§r"
    `)
  })
})
