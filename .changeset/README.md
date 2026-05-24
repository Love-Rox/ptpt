# Changesets

This folder holds [changesets](https://github.com/changesets/changesets):
intent-to-release notes that drive version bumps and changelogs.

Add one with:

```sh
bun changeset
```

Pick the affected packages and a semver bump (patch / minor / major) and write a
short summary. On release, `bun run version` consumes the changesets to bump
versions and update changelogs, and `bun run release` builds and publishes.
