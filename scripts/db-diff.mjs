// 로컬 Supabase와 운영 DB의 public·private 스키마를 객체 단위로 비교한다.
// migration이 auth·storage에 만드는 것(auth.users 트리거, Storage 버킷·정책)도 함께 비교한다.
// 운영은 읽기만 하고, 받은 스키마는 임시 폴더에 잠깐 썼다가 바로 지운다.
//   PROD_DB_URL='<비밀번호 없는 주소>' npm run db:diff
//   npm run db:diff -- --local-only <스키마 덤프 파일>   (운영 대신 파일과 비교하는 시험용, auth·storage는 빼고 비교)
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOCAL_CONTAINER = 'supabase_db_bang-online-store';
const IMAGE = 'public.ecr.aws/supabase/postgres:17.6.1.087';
const SCHEMA_ARGS = ['--schema-only', '--schema=public', '--schema=private'];
const IGNORE_FILE = new URL('../supabase/schema-diff-ignore.txt', import.meta.url);
// One "key<TAB>definition" line per auth.users trigger, storage bucket and storage policy.
// pg_get_triggerdef leaves out whether a trigger is disabled, so tgenabled is appended.
const EXTRA_SQL = `
select 'TRIGGER auth.users.' || tgname || E'\\t' || pg_get_triggerdef(oid) || ' enabled=' || tgenabled::text
  from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal
union all
select 'BUCKET storage.' || id || E'\\t' || concat_ws(' ', public, file_size_limit, allowed_mime_types::text)
  from storage.buckets
union all
select 'POLICY storage.' || tablename || '.' || policyname || E'\\t'
    || regexp_replace(concat_ws(' ', permissive, roles::text, cmd, 'using', qual, 'check', with_check), '\\s+', ' ', 'g')
  from pg_policies where schemaname = 'storage';
`;
// Reads the password once with echo off, so pg_dump and psql share it without it reaching files or arguments.
const PROD_SHELL = `printf 'Password: '; stty -echo 2>/dev/null; read -r PGPASSWORD; stty echo 2>/dev/null; echo
export PGPASSWORD
pg_dump "$1" ${SCHEMA_ARGS.join(' ')} -f /out/prod.sql && psql "$1" -X -A -t -v ON_ERROR_STOP=1 -f /out/extra.sql -o /out/extra.txt`;

class Refusal extends Error {}

function fail(message) {
  throw new Refusal(message);
}

function runLocal(args, what) {
  const result = spawnSync('docker', ['exec', LOCAL_CONTAINER, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) fail(`로컬 ${what}을 읽지 못했습니다. npx supabase start를 먼저 실행하세요.\n${result.stderr ?? ''}`);
  return result.stdout;
}

function prodSchema() {
  const url = process.env.PROD_DB_URL;
  if (!url) fail('PROD_DB_URL(비밀번호 없는 session pooler 주소)이 필요합니다.');
  if (/:\/\/[^/@]+:[^/@]+@/.test(url)) fail('연결 문자열에 비밀번호를 넣지 마세요. 실행 중에 입력합니다.');
  // The password prompt needs a real terminal so the typed password stays hidden.
  if (!process.stdin.isTTY) fail('비밀번호 입력이 필요해 터미널 앱에서 직접 실행해야 합니다.');

  const dir = mkdtempSync(join(tmpdir(), 'bang-db-diff-'));
  try {
    writeFileSync(join(dir, 'extra.sql'), EXTRA_SQL);
    const result = spawnSync('docker', ['run', '--rm', '-it', '-v', `${dir}:/out`, IMAGE,
      'sh', '-c', PROD_SHELL, 'sh', url], { stdio: 'inherit' });
    if (result.status !== 0) fail('운영 스키마를 받지 못했습니다.');
    return { schema: readFileSync(join(dir, 'prod.sql'), 'utf8'), extra: readFileSync(join(dir, 'extra.txt'), 'utf8') };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// pg_dump writes one "-- Name: …; Type: …; Schema: …" header per object, so objects are compared by that key.
// Lines are kept as written: joining them could turn a comment and the next statement into one identical-looking line.
function objects(dump) {
  const result = new Map();
  for (const block of dump.split(/\n(?=--\n-- Name: )/)) {
    const header = block.match(/^--\n-- Name: (.+?); Type: (.+?); Schema: (.+?); Owner/);
    if (!header) continue;
    const [, name, type, schema] = header;
    const body = block
      .split('\n')
      .filter(line => !line.startsWith('--') && !/^\\(un)?restrict /.test(line) && line.trim() !== '')
      .join('\n')
      .trim();
    result.set(`${type} ${schema}.${name}`, body);
  }
  return result;
}

function extraObjects(text, result) {
  for (const line of text.split('\n')) {
    const tab = line.indexOf('\t');
    if (tab > 0) result.set(line.slice(0, tab), line.slice(tab + 1));
  }
  return result;
}

function ignored() {
  return new Set(readFileSync(IGNORE_FILE, 'utf8')
    .split('\n')
    .map(line => line.replace(/#.*/, '').trim())
    .filter(Boolean));
}

function compare() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf('--local-only');
  const fileOnly = fileIndex >= 0;
  if (fileOnly && !args[fileIndex + 1]) fail('--local-only 뒤에 파일 경로가 필요합니다.');

  // Local first, so a stopped local stack is caught before asking for the production password.
  const local = objects(runLocal(['pg_dump', '-U', 'postgres', ...SCHEMA_ARGS], '스키마'));
  if (!fileOnly) extraObjects(runLocal(['psql', '-U', 'postgres', '-X', '-A', '-t', '-c', EXTRA_SQL], 'auth·storage 정보'), local);
  const remote = fileOnly ? { schema: readFileSync(args[fileIndex + 1], 'utf8'), extra: '' } : prodSchema();
  const prod = extraObjects(remote.extra, objects(remote.schema));
  const skip = ignored();

  const lines = [];
  for (const [key, body] of local) {
    if (skip.has(key)) continue;
    if (!prod.has(key)) lines.push(`+ 로컬만 ${key}`);
    else if (prod.get(key) !== body) lines.push(`~ 내용 다름 ${key}`);
  }
  for (const key of prod.keys()) {
    if (!skip.has(key) && !local.has(key)) lines.push(`- 운영만 ${key}`);
  }
  return lines.sort();
}

let lines;
try {
  lines = compare();
} catch (error) {
  if (!(error instanceof Refusal)) throw error;
  console.error(error.message);
  process.exit(2);
}
for (const line of lines) console.log(line);
console.log(lines.length ? `차이 ${lines.length}` : '차이 0');
process.exit(lines.length ? 1 : 0);
