import { fordir } from "leafy-utils";
import path from "path";

fordir({
	inputPath: "loot_tables",
	outputPath: "functions/loot",
	extensions: {
		json(buffer, givenpath, filename) {
			filename = filename.replace(/\.json$/, "");
			return {
				data: `loot insert ~~~ "${path.normalize(path.join(givenpath, filename))}"`,
				filename: filename + ".mcfunction",
			};
		},
	},
});
