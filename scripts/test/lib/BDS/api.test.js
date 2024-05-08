import { Tags, registerAsync } from '@minecraft/server-gametest'
import { TestStructures } from 'test/constants.js'
import { request } from '../../../lib/BDS/api.js'

registerAsync('lib.bds.api', 'ping', async test => {
  const res = await request('ping', '')
  test.assert(res.status === 200, 'Response status should be 200')
  test.succeed()
})
  .structureName(TestStructures.empty)
  .tag(Tags.suiteDefault)
