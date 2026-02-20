import { Player, system } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { I18nMessage } from 'lib/i18n/message'
import { i18n } from 'lib/i18n/text'
import { onLoad } from 'lib/utils/load-ref'
import './command'

interface ClanTemporalMember {
  until: number
}

export enum ClanRole {
  Member = 'member',
  Helper = 'helper',
  Owner = 'owner',
}

const roleNames: Record<ClanRole, I18nMessage> = {
  [ClanRole.Member]: i18n`Участник`,
  [ClanRole.Helper]: i18n`Помошник`,
  [ClanRole.Owner]: i18n`Владелец`,
}

export interface ClanMember {
  id: string
  createdAt: number
  updatedAt: number
  role: ClanRole
}

interface ClanJSON {
  members2: ClanMember[]

  /** @deprecated Use {@link members2} instead */
  members?: string[]
  /** @deprecated Use {@link members2} instead */
  owners?: string[]

  temporalMembers?: Record<string, ClanTemporalMember>

  name: string
  shortname: string

  invites: string[]
  joinRequests: string[]

  createdAt: string
}

export class Clan {
  private static database = table<ClanJSON>('clan')

  static roleToString(role: ClanRole) {
    return roleNames[role]
  }

  static getPlayerClan(playerId: string) {
    for (const clan of this.instances.values()) {
      if (clan.isMember(playerId)) return clan
    }
  }

  static getAll() {
    return this.instances.values()
  }

  static get(id: string) {
    return this.instances.get(id)
  }

  static create(player: Player, name: string, shortname: string) {
    while (this.database.has(name)) name += '-'

    this.database.set(name, {
      members2: [],

      name,
      shortname,

      invites: [],
      joinRequests: [],

      createdAt: new Date().toISOString(),
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const clan = new Clan(name, this.database.get(name)!)
    clan.addMember(player.id, ClanRole.Owner)
    return clan
  }

  static getInvites(playerId: string) {
    return [...Clan.getAll()].filter(e => e.isInvited(playerId))
  }

  private static instances = new Map<string, Clan>()

  static {
    onLoad(() =>
      system.run(() => {
        for (const [id, db] of this.database.entries()) {
          if (!db) continue

          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          db.members2 ??= []

          const clan = new Clan(id, db)

          // Migrate old format
          if (db.owners?.length) {
            for (const m of db.owners) clan.addMember(m, ClanRole.Owner)
            delete db.owners
          }
          if (db.members?.length) {
            for (const m of db.members) clan.addMember(m)
            delete db.members
          }
        }
      }),
    )
  }

  constructor(
    public readonly id: string,
    public readonly db: ClanJSON,
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
    return this.db.members2 as readonly ClanMember[]
  }

  get membersIds() {
    return this.db.members2.map(e => e.id) as readonly string[]
  }

  get owners() {
    return this.db.members2.filter(e => e.role === ClanRole.Owner).map(e => e.id) as readonly string[]
  }

  get joinRequests() {
    return this.db.joinRequests as Readonly<ClanJSON['joinRequests']>
  }

  get invites() {
    return this.db.invites as Readonly<ClanJSON['invites']>
  }

  isMember(playerId: string) {
    return !!this.getMember(playerId)
  }

  isOwner(playerId: string) {
    return this.getMember(playerId)?.role === ClanRole.Owner
  }

  isHelper(playerId: string) {
    return this.getMember(playerId)?.role === ClanRole.Helper
  }

  isInvited(playerId: string) {
    return this.db.invites.includes(playerId)
  }

  getMember(playerId: string) {
    return this.db.members2.find(e => e.id === playerId)
  }

  setMemberRole(playerId: string, role: ClanRole) {
    const member = this.getMember(playerId)

    if (!member) return
    member.role = role
  }

  remove(playerId: string) {
    this.db.members2 = this.db.members2.filter(e => e.id !== playerId)
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

  addMember(id: string, role: ClanRole = ClanRole.Member) {
    if (this.isMember(id)) return

    for (const clan of Clan.getAll()) {
      clan.db.joinRequests = clan.db.joinRequests.filter(e => e !== id)
      clan.db.invites = clan.db.invites.filter(e => e !== id)
    }
    this.db.members2.push({ id, role, createdAt: Date.now(), updatedAt: Date.now() })
  }

  delete() {
    Clan.database.delete(this.id)
    Clan.instances.delete(this.id)
  }

  addTemporalMember(id: string, until: number) {
    this.db.temporalMembers ??= {}
    this.db.temporalMembers[id] = { until }
  }

  removeTemporalMember(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (this.db.temporalMembers) delete this.db.temporalMembers[id]
  }

  isTemporalMemberValid(id: string, member?: ClanTemporalMember) {
    if (!member) return false

    // 0 means forever
    if (member.until === 0) return true

    if (Date.now() > member.until) {
      this.removeTemporalMember(id)
      return false
    }

    return true
  }

  get temporalMembers() {
    if (!this.db.temporalMembers) return []

    const members: { id: string; until: number }[] = []
    for (const [id, member] of Object.entries(this.db.temporalMembers)) {
      if (this.isTemporalMemberValid(id, member)) members.push({ id, until: member.until })
    }
    return members
  }

  isTemporalMember(id: string): boolean {
    return this.isTemporalMemberValid(id, this.db.temporalMembers?.[id])
  }

  getTemporalMember(id: string) {
    const member = this.db.temporalMembers?.[id]
    if (this.isTemporalMemberValid(id, member)) return member
  }
}
