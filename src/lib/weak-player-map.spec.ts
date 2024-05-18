import { suite, test } from 'test/framework'
import { WeakOnlinePlayerMap, WeakPlayerMap } from './weak-player-map'

suite('WeakPlayerMap', () => {
  test('testWeakPlayerMap', async test => {
    const player = test.player()
    const playerMap = new WeakPlayerMap<string>({ removeOnLeave: true })

    playerMap.set(player, 'testValue')

    test.assert(playerMap.get(player) === 'testValue', "Value should be 'testValue'")
    test.assert(playerMap.has(player), 'Map should contain the player')

    player.remove()

    test.succeedWhen(() => {
      test.assert(!playerMap.has(player), 'Map should not contain the player after leaving')
    })
  })

  test('testWeakPlayerMapOffline', async test => {
    const player = test.player()
    const playerMap = new WeakPlayerMap<string>({ removeOnLeave: false })

    playerMap.set(player, 'testValue')

    test.assert(playerMap.get(player) === 'testValue', "Value should be 'testValue'")
    test.assert(playerMap.has(player), 'Map should contain the player')

    player.remove()

    test.assert(playerMap.has(player), 'Map should contain the player after leaving')
  })

  test('testWeakPlayerMapCallback', async test => {
    const player = test.player()
    const playerId = player.id
    let called = 0
    const playerMap = new WeakPlayerMap<string>({
      removeOnLeave: true,
      onLeave(pId) {
        test.assert(pId === playerId, 'Player id should match')
        called++
      },
    })

    playerMap.set(player, 'testValue')

    test.assert(playerMap.get(player) === 'testValue', "Value should be 'testValue'")
    test.assert(playerMap.has(player), 'Map should contain the player')

    player.remove()

    test.assert(playerMap.has(player), 'Map should not contain the player after leaving')
    test.assert(called === 1, 'On leave callback should be called once')
  })

  test('testWeakOnlinePlayerMap', async test => {
    const player = test.player()
    const onlinePlayerMap = new WeakOnlinePlayerMap<string>()

    onlinePlayerMap.set(player, 'testValue')

    const entry = onlinePlayerMap.get(player)
    test.assert(entry?.value === 'testValue', "Value should be 'testValue'")
    test.assert(entry?.player === player, 'Player should match the key player')

    player.remove()

    test.succeedWhen(() => {
      test.assert(!onlinePlayerMap.has(player), 'Map should not contain the player after leaving')
    })
  })
})
