const commands = [
	"./general/desel.js",
	"./general/drawsel.js",
	"./general/id.js",
	"./general/menu.js",
	"./general/item.js",
	"./general/redo.js",
	"./general/undo.js",

	"./selection/chunk.js",
	"./selection/expand.js",
	"./selection/hpos1.js",
	"./selection/hpos2.js",
	"./selection/pos1.js",
	"./selection/pos2.js",
	"./selection/size.js",
	"./selection/wand.js",

	"./region/set.js",

	"./clipboard/copy.js",
	"./clipboard/paste.js",

	"./generation/cyl.js",
	"./generation/hcyl.js",
	"./generation/hpyramid.js",
	"./generation/hsphere.js",
	"./generation/pyramid.js",
	"./generation/sphere.js",

	"./tools/brush.js",
	"./tools/nylium.js",
	"./tools/shovel.js",
	"./tools/tool.js",
];

import load from "../../../import.js";

load({
	array: commands,
	message: "WorldEdit commands",
	fn: (module) => import(module),
	st: 0,
});
