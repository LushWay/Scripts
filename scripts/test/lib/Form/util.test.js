import { registerAsync } from '@minecraft/server-gametest'

registerAsync('lib', 'form.util', async test => {
  for (let i = 0; i <= 12; i++) {
    test.spawnSimulatedPlayer({ x: 0, y: 0, z: 0 }, 'Test player ' + i)
  }

  test.print('Test ready')
})
  .maxTicks(9999999)
  .structureName('Test:flat_5x5x5')
  .tag('sim')
