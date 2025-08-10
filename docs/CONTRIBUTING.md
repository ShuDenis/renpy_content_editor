# Contributing

## Branching scheme

- `main` – stable release branch.
- `develop` – integration branch for upcoming releases.
- `release/X.Y` – preparation branches for version X.Y. Merged into `main` and `develop` at release.
- `feature/<name>` – feature development off `develop`.
- `fix/<name>` – bug fixes targeting `develop`.
- `core/<name>` – changes to core functionality.
- `hotfix/<name>` – urgent fixes off `main`, merged back into `main` and `develop`.

## Versioning

This project follows [Semantic Versioning](https://semver.org/) (SemVer).
Releases are tagged as `vX.Y.Z`. Pre-releases use suffixes like:

- `-alpha.N`
- `-beta.N`
- `-rc.N`

## Changelog

- Add changelog fragments under `changelog/unreleased/*.md` as part of each change.
- During a release, fragments are combined into `changelog/vX.Y.Z.md`.
- Update `CHANGELOG.md` to reference the new release file.

