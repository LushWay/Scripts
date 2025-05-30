import { Player, world } from '@minecraft/server'
import { Rewards } from 'lib/shop/rewards'

export namespace Achievement {
  export interface DBSingle<T = unknown> {
    id: string
    db: T
    // Done date
    d?: number
    // Reward taken?
    r?: number
  }

  export interface DB {
    s: DBSingle[]
  }
}

type StripUnneded<T extends Achievement<unknown>> = Omit<T, 'isRewardsTaken' | 'takeRewards' | 'getDatabase' | 'reward'>
type CreatorAchievement<T> = (ctx: StripUnneded<Achievement<T>>) => void

export class Achievement<T> {
  static list: Achievement<unknown>[] = []

  static create() {
    return {
      id: (id: string) => ({
        name: (name: string) => ({
          defaultStorage: <T>(defaultStorage: () => T) => ({
            creator: (creator: CreatorAchievement<T>) => ({
              reward: (reward: Rewards) => {
                return new Achievement<T>(id, name, defaultStorage, creator, reward)
              },
            }),
          }),
        }),
      }),
    }
  }

  private stack: string | undefined

  protected constructor(
    readonly id: string,
    readonly name: string,
    protected readonly databaseDefaultValue: () => T,
    creator: (ctx: Achievement<T>) => void,
    readonly reward: Rewards,
  ) {
    this.stack = new Error().stack
    const duplicate = Achievement.list.find(e => e.id === id)
    if (duplicate) {
      console.warn('Duplicate achievement:', id, '1:', this.stack, '2:', duplicate.stack)
    }

    creator(this)
    Achievement.list.push(this)
  }

  done(player: Player) {
    const db = this.getDatabase(player)
    if (db.d) return

    player.success('Достижение получено: ' + this.name + '! Заберите награды использовав .achiv')
    db.d = Date.now()
  }

  undone(player: Player) {
    const db = this.getDatabase(player)
    delete db.d
  }

  break(blocks: string | string[], subscriber: (p: Player, typeId: string) => void) {
    world.afterEvents.playerBreakBlock.subscribe(({ player, brokenBlockPermutation }) => {
      const id = brokenBlockPermutation.type.id
      if (blocks.length) {
        if (typeof blocks === 'string') {
          if (blocks !== id) return
        } else if (!blocks.includes(id)) return
      }

      subscriber(player, id)
    })
  }

  isDone(player: Player) {
    return !!this.getDatabase(player).d
  }

  isRewardTaken(player: Player) {
    return !!this.getDatabase(player).r
  }

  takeRewards(player: Player) {
    if (this.isRewardTaken(player)) return

    this.getDatabase(player).r = Date.now()
    this.reward.give(player, false)
  }

  getDatabase(player: Player): Achievement.DBSingle<T> {
    const storage = player.database.achivs?.s.find(e => e.id === this.id)
    if (!storage) {
      const db = { id: this.id, db: this.databaseDefaultValue() }
      player.database.achivs ??= { s: [] }
      player.database.achivs.s.push(db)
      return db
    }

    return storage as Achievement.DBSingle<T>
  }

  storage(player: Player) {
    return this.getDatabase(player).db
  }
}

export class CountingAchievement<T extends { count: number }> extends Achievement<T> {
  static createV<T extends { count: number }>() {
    return {
      value: (value: number) => ({
        id: (id: (v: number) => string) => ({
          name: (name: (v: number) => string) => ({
            creator: (creator: (ctx: CountingAchievement<T>) => void) => {
              let d: undefined | (() => T)

              const a = {
                defaultStorage: (defaultStorage: () => T) => ((d = defaultStorage), a),
                reward: (reward: Rewards) => {
                  return new this<T>(value, id, name, creator as CreatorAchievement<T>, reward, d)
                },
              }

              return a
            },
          }),
        }),
      }),
    }
  }

  protected constructor(
    protected readonly value: number,
    id: (v: number) => string,
    name: (v: number) => string,
    creator: (ctx: StripUnneded<CountingAchievement<T>>) => void,
    reward: Rewards,
    databaseDefaultValue: () => T = () => ({ count: 0 }) as T,
  ) {
    super(id(value), name(value), databaseDefaultValue, creator as CreatorAchievement<T>, reward)
  }

  diff(player: Player, value: number) {
    const storage = this.storage(player)
    storage.count += value
    if (storage.count >= this.value) this.done(player)
  }
}
