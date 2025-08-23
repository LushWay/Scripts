import { getProvider, table } from './abstract'

describe('abstract table', () => {
  it('should return provider', () => {
    expect(getProvider()).toBeTruthy()
  })

  it('should return actual provider', () => {
    table('testing').set('value', 5)

    expect(getProvider().getRawTableData('testing')).toMatchInlineSnapshot(`"{"value":5}"`)
  })
})
