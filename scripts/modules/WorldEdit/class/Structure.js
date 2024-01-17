import { world } from '@minecraft/server'
import { WE_CONFIG } from '../config.js'
import { Cuboid } from '../utils/cuboid.js'

// TODO Loading using tickingareas

export class Structure {
  /**
   * @private
   * @type {{
   *		name: string,
   *		pos1: Vector3,
   *		pos2: Vector3,
   *	}[]}
   */
  structures = []

  /**
   * Creates a new structure save
   * @param {string} prefix
   * @param {Vector3} pos1
   * @param {Vector3} pos2
   */
  constructor(prefix, pos1, pos2, id = Date.now().toString(32)) {
    this.id = id
    this.prefix = `${prefix}|${this.id}`
    this.pos1 = pos1
    this.pos2 = pos2

    this.save()
  }

  save() {
    const cubes = new Cuboid(this.pos1, this.pos2).split(WE_CONFIG.STRUCTURE_CHUNK_SIZE)

    let errors = 0
    let all = 0
    for (const [i, cube] of cubes.entries()) {
      const name = `${this.prefix}|${i}`
      const pos1 = cube.pos1
      const pos2 = cube.pos2
      const result = world.overworld.runCommand(
        `structure save "${name}" ${pos1.x} ${pos1.y} ${pos1.z} ${pos2.x} ${pos2.y} ${pos2.z} false memory true`,
        { showError: true }
      )
      all++
      if (result > 0) {
        this.structures.push({
          name,
          pos1,
          pos2,
        })
      } else {
        errors++

        /*
        world.say(
          "§c► §fЧанки будут подгружены с помощью игрока"
        );
        world.overworld.runCommandAsync(`tickingarea remove safezone`);
        world.overworld.runCommandAsync(
          `tickingarea add ${pos1.x} ${pos1.y} ${pos1.z} ${pos2.x} ${pos2.y} ${pos2.z} safezone`
        );
        setTickTimeout(() => {
            world.overworld.runCommandAsync(
            `structure save ${name} ${pos1.x} ${pos1.y} ${pos1.z} ${pos2.x} ${pos2.y} ${pos2.z} memory`
          )
          this.files.push({
            name: name,
            pos1: pos1,
            pos2: pos2,
          });
          world.say("§9► §fСохранено.");
        }, 80);
        */
      }
    }
    if (errors > 0)
      throw new Error(
        `§c${errors}§f/§a${all}§c не сохранено. Возможно, часть области была непрогруженна. Попробуйте снова, перед этим встав в центр.`
      )
  }

  async load(pos = this.pos1, additional = '') {
    let errors = 0
    let all = 0
    for (const file of this.structures) {
      const result = world.overworld.runCommand(
        `structure load "${file.name}" ${pos.x} ${pos.y} ${pos.z}${additional}`,
        {
          showError: true,
        }
      )
      all++
      if (result === 0) {
        errors++
        // world.say("§c► §fЧанки будут подгружены с помощью области");
        // world.overworld.runCommand(`tickingarea remove safezone`);
        // world.overworld.runCommand(
        // 	`tickingarea add ${file.pos1.x} ${file.pos1.y} ${file.pos1.z} ${file.pos2.x} ${file.pos2.y} ${file.pos2.z} safezone`
        // );
        // setTickTimeout(
        // 	() => {
        // 		world.say("§9►");
        // 		world.overworld.runCommand(`structure load ${file.name} ${file.pos1.x} ${file.pos1.y} ${file.pos1.z}`);
        // 		world.say("§9► §fЗагружено.");
        // 	},
        // 	40,
        // 	"structureLoad"
        // );
      }
      await nextTick
    }
    if (errors > 0)
      throw new Error(
        `§c${errors}§f/§2${all}§c не загружено. Возможно, часть области была непрогруженна. Попробуйте снова, перед этим встав в центр.`
      )
  }
}
