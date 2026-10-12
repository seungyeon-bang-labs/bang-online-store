import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Execute real TS/TSX code; replace only external boundaries in each test.
export function loadTs(relativePath, mocks = {}) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const compiledModule = { exports: {} };
    cache.set(filename, compiledModule);
    const realRequire = createRequire(filename);
    function requireModule(id) {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id === 'server-only') return {};
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/')
          ? path.join(root, 'src', id.slice(2))
          : path.resolve(path.dirname(filename), id);
        const target = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]
          .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (target && /\.tsx?$/.test(target)) return load(target);
      }
      return realRequire(id);
    }
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {
      filename,
    })(requireModule, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  return load(path.join(root, relativePath));
}
