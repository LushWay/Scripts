import * as fs from "fs"
import {
  exec as $exec
} from "child_process"

function exec(command) {
  $exec(command, (error, stdout, stderror) => {
    if (error) throw error
    if (stderror) throw stderror
    if (stdout) console.log(stdout)
  })
}

const PACKAGE_PATH = "./package.json"
const COMMIT_PATH = '.git/COMMIT_EDITMSG'

const raw_package = fs.readFileSync(PACKAGE_PATH).toString()
const parsed_package = JSON.parse(raw_package)
let package_modified = false

console.log(parsed_package)
const version = parsed_package.version?.split(".") ?? [0, 0, 0]
const argv = process.argv[3] ?? "f"

const actions = {
  r() {
    updateVersion(2,
      "Release: ")
  },
  u() {
    updateVersion(1,
      "Update: ")
  },
  f() {
    updateVersion(0)
  }
}


if (!(argv in actions)) {
  console.error(
    `Argv[0] (${argv}) must be one of this: ${Object.keys(actions).join("\n")}`
  )
  process.exit(1)
}

actions[argv]()

function updateVersion(level, prefix = null) {
  version[level]++
  const strVersion = version.join(".")
  parsed_package.version = strVersion
  package_modified = true

  exec(`git commit -a --message=${prefix ? (prefix + ": "): ""}${strVersion}`)
}

if (package_modified) {
  const updated_package = JSON.stringify(parsed_package, null, " ")
  fs.writeFileSync(PACKAGE_PATH, updated_package)
}