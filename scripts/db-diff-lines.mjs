// db:diff의 비교 규칙. 양쪽 덤프는 같은 pg_dump가 만들므로 다듬지 않고 줄 그대로 비교한다.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Only the \restrict/\unrestrict lines are dropped: pg_dump puts a fresh random key in them on every run.
export function comparable(schema, extra = '') {
  const lines = schema.split('\n').filter(line => !/^\\(un)?restrict /.test(line));
  const extraLines = extra.split('\n').filter(Boolean).sort();
  return [...lines, '-- auth·storage·event trigger', ...extraLines, ''].join('\n');
}

// Returns the unified diff (empty when identical) and the number of changed lines.
export function lineDiff(prod, local) {
  const dir = mkdtempSync(join(tmpdir(), 'bang-db-diff-'));
  try {
    writeFileSync(join(dir, 'prod'), prod);
    writeFileSync(join(dir, 'local'), local);
    const result = spawnSync('diff', ['-u', '--label', '운영', '--label', '로컬', join(dir, 'prod'), join(dir, 'local')], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    if (result.status !== 0 && result.status !== 1) throw new Error(`diff를 실행하지 못했습니다.\n${result.stderr ?? ''}`);
    // The first two lines are the "--- 운영" / "+++ 로컬" headers; a removed SQL comment also starts with "---".
    const changes = result.stdout.split('\n').slice(2).filter(line => /^[-+]/.test(line)).length;
    return { text: result.stdout, changes };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
