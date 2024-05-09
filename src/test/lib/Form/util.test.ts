import { Tags, registerAsync } from '@minecraft/server-gametest'
import { TestStructures } from 'test/constants'

registerAsync('lib', 'form.util', async test => {
  // for (let i = 0; i <= 12; i++) {
  //   test.spawnSimulatedPlayer({ x: 0, y: 0, z: 0 }, 'Test player ' + i)
  // }
  // test.print('Test ready')
})
  .maxTicks(9999999)
  .structureName(TestStructures.flat)
  .tag(Tags.suiteDisabled)
