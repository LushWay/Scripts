import { Player, system, world } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import './command'

interface StoredClan {
  members: string[]
  owners: string[]

  name: string
  shortname: string

  invites: string[]
  joinRequests: string[]

  createdAt: string
}

export class Clan {
  private static database = table<StoredClan>('clan')

  static getPlayerClan(playerId: string) {
    for (const clan of this.instances.values()) {
      if (clan.isMember(playerId)) return clan
    }
  }

  static getAll() {
    return this.instances.values()
  }

  static create(player: Player, name: string, shortname: string) {
    while (this.database.has(name)) name += '-'

    this.database.set(name, {
      members: [player.id],
      owners: [player.id],

      name,
      shortname,

      invites: [],
      joinRequests: [],

      createdAt: new Date().toISOString(),
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return new Clan(name, this.database.get(name)!)
  }

  static getInvites(playerId: string) {
    return [...Clan.getAll()].filter(e => e.isInvited(playerId))
  }

  private static instances = new Map<string, Clan>()

  static {
    world.afterEvents.worldLoad.subscribe(() =>
      system.run(() => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        for (const [id, db] of this.database.entries()) new Clan(id, db!)
      }),
    )
  }

  constructor(
    private readonly id: string,
    public readonly db: StoredClan,
  ) {
    const clan = Clan.instances.get(this.id)
    if (clan) return clan

    Clan.instances.set(this.id, this)
  }

  get name() {
    return this.db.name
  }
  set name(v) {
    this.db.name = v
  }

  get shortname() {
    return this.db.shortname
  }
  set shortname(v) {
    this.db.shortname = v
  }
  get createdAt() {
    return new Date(this.db.createdAt)
  }

  get members() {
    return this.db.members as Readonly<StoredClan['members']>
  }

  get owners() {
    return this.db.owners as Readonly<StoredClan['owners']>
  }

  get joinRequests() {
    return this.db.joinRequests as Readonly<StoredClan['joinRequests']>
  }

  get invites() {
    return this.db.invites as Readonly<StoredClan['invites']>
  }

  isMember(playerId: string) {
    return this.db.members.includes(playerId)
  }

  isOwner(playerId: string) {
    return this.db.owners.includes(playerId)
  }

  isInvited(playerId: string) {
    return this.db.invites.includes(playerId)
  }

  setRole(playerId: string, role: 'member' | 'owner') {
    if (role === 'member') this.db.owners = this.db.owners.filter(e => e !== playerId)
    if (role === 'owner') this.db.owners.push(playerId)
  }

  remove(playerId: string) {
    this.db.members = this.db.members.filter(e => e !== playerId)
    this.db.owners = this.db.owners.filter(e => e !== playerId)
  }

  sendInvite(playerId: string) {
    if (Clan.getPlayerClan(playerId)) return false

    this.db.invites.push(playerId)
    return true
  }

  requestJoin(player: Player) {
    if (Clan.getPlayerClan(player.id)) return false
    if (this.db.joinRequests.includes(player.id)) return false

    this.db.joinRequests.push(player.id)
    return true
  }

  rejectJoin(id: string) {
    this.db.joinRequests = this.db.joinRequests.filter(e => e !== id)
  }

  undoInvite(id: string) {
    this.db.invites = this.db.invites.filter(e => e !== id)
  }

  add(id: string) {
    for (const clan of Clan.getAll()) {
      clan.db.joinRequests = clan.db.joinRequests.filter(e => e !== id)
      clan.db.invites = clan.db.invites.filter(e => e !== id)
    }
    this.db.members.push(id)
  }

  delete() {
    Clan.database.delete(this.id)
    Clan.instances.delete(this.id)
  }
}
