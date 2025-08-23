import { EventLoader, EventLoaderWithArg, EventSignal } from './event-signal'

describe('EventSignal', () => {
  let signal: EventSignal<string>

  beforeEach(() => {
    signal = new EventSignal<string>()
  })

  it('should emit events to subscribers', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    signal.subscribe(callback1)
    signal.subscribe(callback2)

    EventSignal.emit(signal, 'data')

    expect(callback1).toHaveBeenCalledWith('data')
    expect(callback2).toHaveBeenCalledWith('data')
  })

  it('should sort subscribers by position', () => {
    const callback0 = () => {}
    const callback1 = () => {}
    const callback2 = () => {}
    const callback100 = () => {}

    signal.subscribe(callback1, 1)
    signal.subscribe(callback2, 0)
    signal.subscribe(callback0, 2)
    signal.subscribe(callback100, -100)

    const sortedSubscribers = EventSignal.sortSubscribers(signal)

    expect(sortedSubscribers[0]?.[0]).toBe(callback0)
    expect(sortedSubscribers[1]?.[0]).toBe(callback1)
    expect(sortedSubscribers[2]?.[0]).toBe(callback2)
    expect(sortedSubscribers[3]?.[0]).toBe(callback100)
  })

  it('should subscribe and unsubscribe callbacks', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    signal.subscribe(callback1)
    signal.subscribe(callback2)
    EventLoader.emit(signal, 'testData')
    expect(callback1).toHaveBeenCalledWith('testData')
    expect(callback2).toHaveBeenCalledTimes(1)

    signal.unsubscribe(callback1)
    signal.unsubscribe(callback2)
    EventLoader.emit(signal, 'testData')
    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('should work with multiple arguments', () => {
    const callback = vi.fn()

    const signal = new EventSignal<[string, number, boolean], false>()
    signal.subscribe(callback)
    signal.subscribe(arg => {
      expect(arg).toEqual(['string', 3, false])
      return false
    })

    EventSignal.emit(signal, ['string', 3, false])

    expect(callback.mock.calls).toEqual([[['string', 3, false]]])
  })

  it('should work with multiple arguments', () => {
    const callback = vi.fn()

    const signal = new EventSignal<unknown, false, (a: string, b: number, c: boolean) => false>()
    signal.subscribe(callback)

    EventSignal.emit(signal, 'string', 3, false)
    expect(callback.mock.calls).toEqual([['string', 3, false]])
  })
})

describe('EventLoader', () => {
  let loader: EventLoader

  beforeEach(() => {
    loader = new EventLoader()
  })

  it('should call subscribed callbacks immediately if loaded', () => {
    loader.loaded = true
    const callback = vi.fn()

    loader.subscribe(callback)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should call subscribed callbacks on load if not loaded', () => {
    const callback = vi.fn()

    loader.subscribe(callback)
    EventLoader.load(loader)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should call subscribed callbacks with loaded data even after load', () => {
    const callback = vi.fn()

    loader.subscribe(callback)

    EventLoader.load(loader)
    expect(callback).toHaveBeenCalledTimes(1)

    EventLoader.load(loader)
    expect(callback).toHaveBeenCalledTimes(2)
  })
})

describe('EventLoaderWithArg', () => {
  let loader: EventLoaderWithArg<number>

  beforeEach(() => {
    loader = new EventLoaderWithArg(42)
  })

  it('should call subscribed callbacks with default value if loaded', () => {
    loader.loaded = true
    const callback = vi.fn()

    loader.subscribe(callback)
    expect(callback).toHaveBeenCalledWith(42)
  })

  it('should call subscribed callbacks with loaded data if not loaded', () => {
    const callback = vi.fn()

    loader.subscribe(callback)
    EventLoaderWithArg.load(loader, 100)

    expect(callback).toHaveBeenCalledWith(100)
  })

  it('should call subscribed callbacks with loaded data even after load', () => {
    const callback = vi.fn()

    loader.subscribe(callback)
    EventLoaderWithArg.load(loader, 100)

    expect(callback).toHaveBeenCalledWith(100)

    EventLoaderWithArg.load(loader, 300)
    expect(callback).toHaveBeenCalledWith(300)
  })

  it('should update load default arg', () => {
    const callback = vi.fn()

    loader.subscribe(callback)
    EventLoaderWithArg.load(loader, 100)

    expect(callback).toHaveBeenCalledWith(100)

    EventLoaderWithArg.load(loader, 300)
    const callback2 = vi.fn()
    loader.subscribe(callback2)
    loader.subscribe(arg => {
      expect(arg).toBe(300)
    })
    expect(callback2).toHaveBeenCalledWith(300)
  })
})
