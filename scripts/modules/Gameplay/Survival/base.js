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
import { LockAction, XCommand, XEntity } from "xapi.js";
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
	}
);

const baseItemStack = new ItemStack(MinecraftItemTypes.barrel);
baseItemStack.setLore(["Поставьте эту бочку и она", "станет базой."]);

new Store({ x: -234, y: 65, z: -74 }, "overworld").addItem(
	baseItemStack,
	new MoneyCost(10)
);

world.afterEvents.itemUseOn.subscribe((data) => {
	if (
		data.itemStack.typeId !== baseItemStack.typeId ||
		!Array.equals(data.itemStack.getLore(), baseItemStack.getLore()) ||
		!(data.source instanceof Player) ||
		LockAction.locked(data.source)
	)
		return;

	const region = RadiusRegion.getAllRegions().find((e) =>
		e.permissions.owners.includes(data.source.nameTag)
	);

	if (region) {
		const isOwner = region.permissions.owners[0] === data.source.id;
		return data.source.tell(
			`§cВы уже ${
				isOwner
					? "владеете базой"
					: `состоите в базе игрока '${XEntity.getNameByID(
							region.permissions.owners[0]
					  )}'`
			} !`
		);
	}

	const nearRegion = Region.getAllRegions().find((r) => {
		if (r instanceof RadiusRegion) {
			return Vector.distance(r.center, data.block.location) < r.radius + 100;
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
				data.block.location
			);
		}
	});

	if (nearRegion) return data.source.tell("§cРядом есть другие регионы!");

	new RadiusRegion(
		Vector.floor(Vector.add(data.block.location, data.faceLocation)),
		30,
		data.block.dimension.type,
		{
			doorsAndSwitches: false,
			openContainers: false,
			pvp: true,
			allowedEntitys: "all",
			owners: [data.source.id],
		}
	);
	data.source.tell(
		"§a► §fБаза успешно создана! Чтобы открыть меню базы используйте команду §6-base"
	);
	data.source.playSound("random.levelup");
});

const base = new XCommand({
	name: "base",
	description: "Меню базы",
});
base.executes((ctx) => {
	if (LockAction.locked(ctx.sender)) return;
	const base = RadiusRegion.getAllRegions().find((e) =>
		e.permissions.owners.includes(ctx.sender.id)
	);

	if (!base)
		return ctx.reply(
			"§cУ вас нет базы! Вступите в существующую или создайте свою."
		);

	baseMenu(ctx.sender, base);
});

system.runInterval(
	() => {
		const playersLocations = world.getPlayers().map((p) => {
			return { dimension: p.dimension.type, loc: p.location };
		});

		for (const base of RadiusRegion.getAllRegions()) {
			const block = world[base.dimensionId].getBlock(Vector.floor(base.center));
			if (!block) continue;
			if (block.typeId === MinecraftBlockTypes.barrel.id) {
				if (
					playersLocations.find(
						(e) =>
							e.dimension === base.dimensionId &&
							Vector.distance(base.center, e.loc) < 10
					)
				)
					world[base.dimensionId].spawnParticle(
						"minecraft:endrod",
						Vector.add(base.center, { x: 0.5, y: 1.5, z: 0.5 }),
						new MolangVariableMap()
					);

				continue;
			}

			base.forEachOwner((player) => {
				player.tell(
					`§cБаза с владельцем §f${XEntity.getNameByID(player.id)}§c разрушена.`
				);
			});
			base.delete();
		}

		updateBases();
	},
	"baseInterval",
	10
);
