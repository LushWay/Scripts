import { Tags, registerAsync } from '@minecraft/server-gametest'
import { TestStructures } from 'test/constants'
import { request } from '../../../lib/bds/api'

registerAsync('lib.bds.api', 'ping', async test => {
  const res = await request('ping', '')
  test.assert(res.status === 200, 'Response status should be 200')
  test.succeed()
})
  .structureName(TestStructures.empty)
  .tag(Tags.suiteDefault)
