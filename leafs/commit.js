import { commiter } from "leafy-utils";

commiter.on("after_add_commit_push", async ({ version, suffix, type, prev_version }) => {
	console.log(prev_version.join("."), "->", version.join("."));
});

commiter.emit("add_commit_push", { silentMode: false });
