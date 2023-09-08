import {
	ItemStack,
	MinecraftBlockTypes,
	MinecraftItemTypes,
	MolangVariableMap,
	Player,
	Vector,
	system,
	world,
} from "@minecraft/server";
import { LockAction, XCommand } from "xapi.js";
import {
	RadiusRegion,
	Region,
	forEachItemAt,
} from "../../Server/Region/Region.js";
import { MoneyCost, Store } from "../../Server/Server/store.js";
import { baseMenu } from "./baseMenu.js";

/**
 * @type {Vector3[]}
 */
let bases = [];

function updateBases() {
	bases = RadiusRegion.getAllRegions().map((e) => e.center);
}

world.afterEvents.blockBreak.subscribe(
	({ block, brokenBlockPermutation, dimension }) => {
		if (bases.includes(block.location)) {
			block.setPermutation(brokenBlockPermutation);

			// setting chest inventory back
			const { container } = block.getComponent("inventory");
			forEachItemAt(dimension, block.location, (e) => {
				container.addItem(e.getComponent("item").itemStack);
				e.kill();
			});
		}
	},
);

export const baseItemStack = new ItemStack(MinecraftItemTypes.barrel);
baseItemStack.setLore(["Поставьте эту бочку и она", "станет базой."]);

new Store({ x: -234, y: 65, z: -74 }, "overworld").addItem(
	baseItemStack,
	new MoneyCost(10),
);

world.beforeEvents.itemUseOn.subscribe((data) => {
	const { source, block, faceLocation, itemStack } = data;
	if (
		!itemStack.isStackableWith(baseItemStack) ||
		!(source instanceof Player) ||
		LockAction.locked(source)
	)
		return;

	const region = RadiusRegion.getAllRegions().find((e) =>
		e.permissions.owners.includes(source.nameTag),
	);

	if (region) {
		const isOwner = region.permissions.owners[0] === source.id;
		data.cancel = true;
		return source.tell(
			`§cВы уже ${
				isOwner
					? "владеете базой"
					: `состоите в базе игрока '${Player.name(
							region.permissions.owners[0],
					  )}'`
			} !`,
		);
	}

	const nearRegion = Region.getAllRegions().find((r) => {
		if (r instanceof RadiusRegion) {
			return Vector.distance(r.center, block.location) < r.radius + 100;
		} else {
			const from = {
				x: r.from.x,
				y: Region.CONFIG.LOWEST_Y_VALUE,
				z: r.from.z,
			};
			const to = { x: r.to.x, y: Region.CONFIG.HIGEST_Y_VALUE, z: r.to.z };

			const min = Vector.min(from, to);
			const max = Vector.max(from, to);

			const size = 30;

			return Vector.between(
				Vector.add(min, { x: -size, y: 0, z: -size }),
				Vector.add(max, { x: size, y: 0, z: size }),
				block.location,
			);
		}
	});

	if (nearRegion) {
		data.cancel = true;
		return source.tell("§cРядом есть другие регионы!");
	}

	system.run(() => {
		new RadiusRegion(
			Vector.floor(Vector.add(block.location, faceLocation)),
			30,
			block.dimension.type,
			{
				doorsAndSwitches: false,
				openContainers: false,
				pvp: true,
				allowedEntitys: "all",
				owners: [source.id],
			},
		);
		source.tell(
			"§a► §fБаза успешно создана! Чтобы открыть меню базы используйте команду §6-base",
		);
		source.playSound("random.levelup");
	});
});

const base = new XCommand({
	name: "base",
	description: "Меню базы",
});
base.executes((ctx) => {
	if (LockAction.locked(ctx.sender)) return;
	const base = RadiusRegion.getAllRegions().find((e) =>
		e.permissions.owners.includes(ctx.sender.id),
	);

	if (!base)
		return ctx.reply(
			"§cУ вас нет базы! Вступите в существующую или создайте свою.",
		);

	baseMenu(ctx.sender, base);
});

system.runInterval(
	() => {
		const playersLocations = world.getPlayers().map((p) => {
			return { dimension: p.dimension.type, loc: p.location };
		});

		for (const base of RadiusRegion.getAllRegions().filter(
			// Ensure that region is a base (enabled pvp)
			(e) => e.permissions.pvp,
		)) {
			const block = world[base.dimensionId].getBlock(Vector.floor(base.center));
			if (!block) continue;
			if (block.typeId === MinecraftBlockTypes.barrel.id) {
				if (
					playersLocations.find(
						(e) =>
							e.dimension === base.dimensionId &&
							Vector.distance(base.center, e.loc) < 10,
					)
				)
					world[base.dimensionId].spawnParticle(
						"minecraft:endrod",
						Vector.add(base.center, { x: 0.5, y: 1.5, z: 0.5 }),
						new MolangVariableMap(),
					);

				continue;
			}

			base.forEachOwner((player) => {
				player.tell(
					`§cБаза с владельцем §f${Player.name(player.id)}§c разрушена.`,
				);
			});
			base.delete();
		}

		updateBases();
	},
	"baseInterval",
	10,
);
