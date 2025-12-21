/* eslint-disable no-console */
/**
 * Orphaned module detector (best-effort)
 *
 * Finds TS/TSX files under `src/` that are not reachable from Next.js App Router
 * entrypoints (all files under `src/app/**`) via static import/export edges.
 *
 * Notes:
 * - This is conservative: it only follows static imports/exports and `import()`.
 * - It intentionally ignores node_modules imports.
 * - It resolves `@/` to `src/` (matches tsconfig/vite alias).
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(repoRoot, 'src');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const IGNORE_SUFFIXES = ['.d.ts', '.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];

function isIgnoredFile(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  if (IGNORE_SUFFIXES.some((s) => normalized.endsWith(s))) return true;
  if (normalized.includes('/src/test/')) return true;
  if (normalized.includes('/src/lib/utils/__tests__/')) return true;
  return false;
}

function walkFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (isIgnoredFile(full)) continue;
    out.push(full);
  }
  return out;
}

function tryResolveFile(basePath) {
  // basePath may already include extension
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) return basePath;

  for (const ext of EXTENSIONS) {
    const candidate = `${basePath}${ext}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }

  // folder index
  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const idx = path.join(basePath, `index${ext}`);
      if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
    }
  }

  return null;
}

function resolveModule(fromFile, spec) {
  if (!spec) return null;

  // Ignore node modules / URLs
  if (!spec.startsWith('./') && !spec.startsWith('../') && !spec.startsWith('@/')) return null;

  let target;
  if (spec.startsWith('@/')) {
    target = path.join(srcRoot, spec.slice(2));
  } else {
    target = path.resolve(path.dirname(fromFile), spec);
  }

  // Ignore CSS/assets/etc
  if (/\.(css|scss|sass|less|svg|png|jpg|jpeg|webp|gif)$/.test(target)) return null;

  const resolved = tryResolveFile(target);
  if (!resolved) return null;

  // Only track modules inside src/
  const rel = path.relative(srcRoot, resolved);
  if (rel.startsWith('..')) return null;

  return path.normalize(resolved);
}

function parseEdges(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);

  /** @type {string[]} */
  const edges = [];

  const addEdge = (moduleSpecifier) => {
    if (!moduleSpecifier) return;
    const resolved = resolveModule(filePath, moduleSpecifier);
    if (resolved) edges.push(resolved);
  };

  const visit = (node) => {
    // import ... from 'x'
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      addEdge(node.moduleSpecifier.text);
    }

    // export * from 'x'
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      addEdge(node.moduleSpecifier.text);
    }

    // dynamic import('x')
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      addEdge(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return edges;
}

function main() {
  const allModules = walkFiles(srcRoot).map((p) => path.normalize(p));

  const roots = allModules.filter((p) => p.replaceAll('\\', '/').includes('/src/app/'));
  const rootSet = new Set(roots);

  /** @type {Map<string, string[]>} */
  const graph = new Map();
  for (const file of allModules) {
    graph.set(file, parseEdges(file));
  }

  /** @type {Set<string>} */
  const reachable = new Set();
  const queue = [...roots];

  while (queue.length) {
    const current = queue.pop();
    if (!current || reachable.has(current)) continue;
    reachable.add(current);
    const deps = graph.get(current) || [];
    for (const dep of deps) {
      if (!reachable.has(dep)) queue.push(dep);
    }
  }

  const orphans = allModules.filter((m) => !reachable.has(m) && !rootSet.has(m));

  const formatRel = (p) => path.relative(repoRoot, p).replaceAll('\\', '/');

  console.log(`Roots: ${roots.length}`);
  console.log(`Modules scanned: ${allModules.length}`);
  console.log(`Reachable: ${reachable.size}`);
  console.log(`Orphans: ${orphans.length}`);

  if (orphans.length) {
    console.log('\nOrphan candidates (verify before deleting):');
    for (const orphan of orphans.sort()) {
      console.log(`- ${formatRel(orphan)}`);
    }
    process.exitCode = 2;
  }
}

main();

