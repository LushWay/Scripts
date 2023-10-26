import fs from "fs";
import tss from "typescript/lib/tsserverlibrary";
fs.writeFile(__dirname + "/a.txt", "aaa", () => {});

export = function init(modules: {
	typescript: typeof import("typescript/lib/tsserverlibrary");
}) {
	const ts = modules.typescript;

	function create(info: tss.server.PluginCreateInfo) {
		const proxy: tss.LanguageService = Object.create(null);

		for (let k of Object.keys(
			info.languageService,
		) as (keyof tss.LanguageService)[]) {
			const x = info.languageService[k]!;
			// @ts-expect-error - JS runtime trickery which is tricky to type tersely
			proxy[k] = (...args: object[]) => x.apply(info.languageService, args);
		}

		info.languageService.getSyntacticDiagnostics = (
			fileName: string,
		): tss.DiagnosticWithLocation[] => {
			const program = info.languageService.getProgram()!;
			const sourceFile = program.getSourceFile(fileName)!;
			if (sourceFile.isDeclarationFile) return [];

			sourceFile.forEachChild((node) => {
				if (node.kind === tss.SyntaxKind.ImportDeclaration) {
					info.project.projectService.logger.info("Info" + node.getText());
				}
			});

			return [];
		};

		return proxy;
	}

	return { create };
};
