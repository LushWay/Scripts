import { Settings } from './settings'

describe('setting change events', () => {
  it('should emit events on change', () => {
    const onChange = vi.fn()
    const settings = Settings.world('groupName', 'group1', {
      name1: {
        name: 'name',
        description: 'description',
        value: true,
        onChange,
      },
    })

    settings.name1 = false
    expect(onChange).toHaveBeenCalledOnce()

    settings.name1 = true
    expect(onChange).toHaveBeenCalledTimes(2)

    settings.name1 = true
    expect(onChange).toHaveBeenCalledTimes(3)
  })
})
