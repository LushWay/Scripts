import { on_commit, commit } from "leafy-utils/commit.js"

on_commit((version, strVersion, message) => {
  console.log(strVersion)
})

commit()