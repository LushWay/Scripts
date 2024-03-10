import { Tags, registerAsync } from '@minecraft/server-gametest'
import { request } from '../../../lib/BDS/api.js'

registerAsync('class', 'net', async test => {
  const res = await request('ping', '')
  test.assert(res.status === 200, 'Response status should be 200')
  test.succeed()
}).tag(Tags.suiteDefault)
