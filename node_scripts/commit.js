import { on_commit } from "leafy-utils/commit.js"

on_commit((version, strVersion, message) => {
  console.log(version)
})
