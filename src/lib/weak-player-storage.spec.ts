import { suite, test } from 'test/framework'
import { WeakPlayerMap } from './weak-player-storage'

suite('WeakPlayerMap', () => {
  test('testWeakPlayerMap', async test => {
    const player = test.player()
    const playerMap = new WeakPlayerMap<string>()

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
    const playerMap = new WeakPlayerMap<string>()

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
})
