import { Singleton } from './singleton'

describe('Singleton', () => {
  it('should create singleton', () => {
    class test extends Singleton {}

    new test()

    test.getInstance()

    class b extends Singleton {}

    expect(() => b.getInstance()).toThrow()

    new b()
  })

  it('should use singleton from subclass', () => {
    class Parent extends Singleton {}

    class Sub extends Parent {}

    const instance = new Sub()

    expect(() => Parent.getInstance()).not.toThrow()
    expect(Parent.getInstance()).toBe(instance)
  })

  it('should use singleton from subclass', () => {
    class Parent extends Singleton {}

    class Sub extends Parent {}

    class Sub2 extends Sub {}

    const instance = new Sub2()

    expect(() => Sub.getInstance()).not.toThrow()
    expect(Sub.getInstance()).toBe(instance)
    expect(() => Parent.getInstance()).not.toThrow()
    expect(Parent.getInstance()).toBe(instance)
  })
})
