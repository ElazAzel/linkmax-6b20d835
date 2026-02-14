# ADR 0024: Repository Security and Privacy

## Status
Accepted

## Context
The project was initially public on GitHub. During a security audit, it was discovered that the `.env` file containing Supabase keys was committed to the git history in the past. Even if the repository is made private, these keys remain in the history and could be retrieved if the repository is leaked or accessed by unauthorized users. Digital footprints of secret keys in public history can also be indexed by security search engines.

## Decision
1. Change repository visibility to **Private** to prevent competitors from copying the codebase.
2. Rewrite the git history to purge all occurrences of the `.env` file from the repository's history across all branches and tags.
3. Recommend rotating (re-generating) all API keys in Supabase, as they should be considered compromised.
4. Update `.gitignore` to ensure internal documentation and meta-files are no longer ignored if they are part of the core repository structure (standardizing on a private repo workflow).

## Consequences
- **History Change**: All commit hashes will be changed. This requires a force push to the remote repository.
- **Coordination**: Any other contributors must re-clone the repository or reset their local branches to the new remote state.
- **Security**: The "blast radius" of a potential leak is significantly reduced.
- **Cleanup**: Existing clones or forks that were caught by search engines/bots prior to this change may still contain the secrets.
