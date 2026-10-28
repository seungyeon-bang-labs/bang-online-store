import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

const container = process.env.CART_TEST_CONTAINER;
if (container) assert.match(container, /^bang-cart-test-[a-z0-9-]+$/, 'Only isolated cart test containers are allowed');
const read = relative => readFileSync(new URL(relative, import.meta.url), 'utf8');
let sequence = 0;

function docker(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', timeout: 30000 });
  return result;
}

export function database(t, { migrate = true } = {}) {
  assert.ok(container, 'CART_TEST_CONTAINER is required; never use a remote DSN');
  const name = `cart_tests_${process.pid}_${Date.now()}_${++sequence}`;
  const created = docker(['exec', container, 'createdb', '-U', 'postgres', name]);
  assert.equal(created.status, 0, created.stderr || created.error?.message);
  t.after(() => {
    const removed = docker(['exec', container, 'dropdb', '-U', 'postgres', name]);
    assert.equal(removed.status, 0, removed.stderr || removed.error?.message);
  });

  const args = ['exec', '-i', container, 'psql', '-X', '-A', '-t', '-q', '-U', 'postgres', '-d', name,
    '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'];
  function sql(text) {
    const result = docker(args, text);
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return result.stdout.trim();
  }
  function reject(text, pattern) {
    const result = docker(args, text);
    assert.notEqual(result.status, 0, text);
    assert.match(result.stderr || result.error?.message || '', pattern);
  }
  function as(userId, text, role = 'authenticated') {
    assert.ok(['anon', 'authenticated', 'service_role'].includes(role));
    if (userId !== null) assert.match(userId, /^[0-9a-f-]{36}$/i);
    return sql(`set role ${role}; set request.jwt.claim.sub='${userId ?? ''}';\n${text}`);
  }
  async function parallel(statements) {
    return Promise.all(statements.map(text => new Promise((resolve, reject) => {
      const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => child.kill('SIGKILL'), 30000);
      child.stdout.setEncoding('utf8').on('data', data => { stdout += data; });
      child.stderr.setEncoding('utf8').on('data', data => { stderr += data; });
      child.stdin.on('error', reject);
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.on('close', code => {
        clearTimeout(timer);
        if (code === 0) resolve(stdout.trim());
        else reject(new Error(stderr || `isolated psql exited ${code}`));
      });
      child.stdin.end(text);
    })));
  }

  sql(read('../db/catalog-fixture.sql'));
  sql(read('../db/cart-fixture.sql'));
  sql(read('../../supabase/migrations/20261017000000_product_catalog.sql'));
  sql(`
    insert into public.categories(id,name,slug) values ('cart-test','테스트','cart-test');
    insert into public.colors(id,code,label,hex_code) values
      (1,'GRAY','그레이','#808080'),(2,'BLACK','블랙','#000000'),(3,'WHITE','화이트','#ffffff');
    insert into public.product_styles(id,category_id,name) values (1,'cart-test','티셔츠');
    insert into public.products(id,style_id,color_id,price,state) values
      (1,1,1,10000,'active'),(2,1,2,10000,'active'),(4,1,3,10000,'active');
    insert into public.product_variants(id,product_id,sku,size,stock,price_offset) values
      (2,1,'1-GY-M','M',10,1000),(7,2,'2-BK-M','M',0,0),(17,4,'4-WH-M','M',10,0);
  `);
  if (migrate) sql(read('../../supabase/migrations/20261023000000_cart.sql'));
  return { sql, reject, as, parallel };
}
