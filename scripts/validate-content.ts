import { loadCatalogFromDisk } from '../src/lib/content/catalog.node';
import { validateCatalog } from '../src/lib/content/validate';

const catalog = loadCatalogFromDisk();
const release = process.argv.includes('--release');
const issues = validateCatalog(catalog, { requireReleaseContent: release });

if (issues.length > 0) {
  for (const issue of issues) console.error(`${issue.code} ${issue.path}: ${issue.message}`);
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        mode: release ? 'release' : 'draft',
        person: catalog.person.editorialStatus,
        timeline: catalog.timeline.length,
        projects: catalog.projects.length,
        outputs: catalog.outputs.length
      },
      null,
      2
    )
  );
}
