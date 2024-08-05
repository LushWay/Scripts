import { t } from 'lib/text'
import { describe, expect, it } from 'vitest'
import { ngettext } from './ngettext'

describe('ngettext', () => {
  it('should stringify num with plurals', () => {
    const n = 10

    const text = ngettext(n, ['блок', 'блока', 'блоков'])
    expect(`§7Было сломано §6${n} §7${text}`).toMatchInlineSnapshot(`"§7Было сломано §610 §7блоков"`)

    expect(t.num`Было сломано ${n} ${['блок', 'блока', 'блоков']}`).toMatchInlineSnapshot(
      `"§7Было сломано §610§7 блоков§7"`,
    )
  })
})
