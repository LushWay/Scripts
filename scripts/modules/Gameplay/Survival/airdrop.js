import { LootTable } from "../Loot/loot.js";

const starter = new LootTable(
	{
		type: "WoodenSword",
		chance: "100%",
		enchantments: {
			unbreaking: {
				"0...2": "50%",
				3: "50%",
			},
		},
	},
	{
		type: "LeatherBoots",
		chance: "50%",
	},
	{
		type: "LeatherLeggings",
		chance: "100%",
	},
	{
		type: "LeatherChestplate",
		chance: "100%",
	},
	{
		type: "LeatherHelmet",
		chance: "50%",
	},
);
