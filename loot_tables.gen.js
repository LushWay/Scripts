import fs from "fs";

const outputPath = "./functions/";

/**
 *
 * @param  {...string} path
 * @returns
 */
function parsePath(...path) {
  path = path.filter((e) => e);
  let output = path[0];
  for (const p of path.slice(1)) {
    output += `${!output.endsWith("/") && !p.startsWith("/") ? "/" : ""}${p}`;
  }
  console.log("Working on path", output);
  return output;
}

function getFiles(path) {
  const out = fs.readdirSync(parsePath("./loot_tables", path), "utf-8", true);
  console.log("Getting files from", path + ":", out.join(", "));
  return out;
}

/**
 *
 * @param {string} path
 * @param {string} name
 * @param {string} text
 */
function addFile(path, name, text) {
  console.log("Adding file", name, "on path", path);
  let e = outputPath;
  for (const p of path.split("/")) {
    e = parsePath(e, p);
    const exist = fs.existsSync(e);
    if (!exist) fs.mkdirSync(e);
  }
  fs.writeFileSync(parsePath(outputPath, path, name), text, (err) => {
    if (err) throw err;
  });
}

function createFunction(path, file_name) {
  const text = `loot insert ~~~ loot "${parsePath(path, file_name)}"`;
  file_name = `${file_name}.mcfunction`;
  return { file_name, text };
}

function parseCatalogue(path) {
  console.log("Parsing catalogue on path", path);
  const files = getFiles(path);

  for (const file of files) {
    if (file.endsWith(".json")) {
      const f = createFunction(path, file.replace(".json", ""));

      addFile(path, f.file_name, f.text);
    } else {
      parseCatalogue(parsePath(path, file));
    }
  }
}

parseCatalogue("");
