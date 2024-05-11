import { suite, test } from 'test/framework'
import { request } from './api'

suite('lib.bds.api', () => {
  test('ping', async test => {
    const res = await request('ping', '')
    test.assert(res.status === 200, 'Response status should be 200')
    test.succeed()
  })
})
