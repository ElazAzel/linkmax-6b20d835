# Page V2 on an older Cloud schema

The frontend and database must both support page drafts. A missing load_page_draft RPC puts the editor into local recovery mode and disables publication.

For an older Cloud database with no page_drafts table, prepare a reviewed transaction:

    node scripts/prepare-page-v2-cloud.mjs --output tmp/page-v2-cloud.sql

The generator never connects to a database. Inspect the target schema, back up the current function definitions, and record row counts and content checksums before running its output in the project SQL editor.

The transaction adds the missing deleted_at column and organization authorization helper, installs the canonical block writer, and applies the draft, audio and write-guard migrations. It preserves existing page, block, event and history rows. It refuses to run when drafts already exist; use the remaining individual migrations on such a database instead.

The organization helper requires the current authenticated user and an existing owner/admin/editor membership. Draft functions enforce page ownership or that membership. Public reads exclude deleted blocks; existing owner and administrator policies retain recovery access. A conflicting block UUID belonging to another page aborts the entire write. Publication rejects missing as well as stale revision numbers.

After deployment, verify the RPCs under anonymous and authenticated roles, compare the original content checksums excluding the newly added columns, and test draft save/reload in the actual editor before publishing content. Schema activation does not switch backend URLs or hosting.

The PostgreSQL suite in src/services/__tests__/page-drafts.sql.test.mjs executes the complete generated transaction, including authorization, CAS conflicts, publication rollback, history recovery, cross-page block IDs, null revisions and deleted-row privacy.
