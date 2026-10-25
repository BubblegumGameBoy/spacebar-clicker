# Sequel development checkpoint

Read SEQUEL_HANDOFF.md first. The editable sequel source and its QA scripts are stored in sequel-source.tar.gz so that a fresh Codex cloud checkout can resume without losing untracked workspace files.

From the repository root: `tar -xzf dev/sequel-source.tar.gz`.

This restores 2/, related pure-rule tests and development tools. It does not overwrite the original root game, Worker or package configuration. Build and publish only the isolated preview as described in the handoff.
