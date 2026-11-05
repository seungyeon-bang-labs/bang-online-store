// db:diff의 비교 규칙. 덤프를 객체 단위로 나누고 로컬과 운영을 비교한다.

// pg_dump writes one "-- Name: …; Type: …; Schema: …; Owner: …" header per object, so objects are compared by that key.
// The owner is part of the key: default privileges exist once per role under the same name.
// Lines are kept as written: joining them could turn a comment and the next statement into one identical-looking line.
export function objects(dump) {
  const result = new Map();
  for (const block of dump.split(/\n(?=--\n-- Name: )/)) {
    const header = block.match(/^--\n-- Name: (.+?); Type: (.+?); Schema: (.+?); Owner: (.*)\n/);
    if (!header) continue;
    const [, name, type, schema, owner] = header;
    const body = block
      .split('\n')
      .filter(line => !line.startsWith('--') && !/^\\(un)?restrict /.test(line) && line.trim() !== '')
      .join('\n')
      .trim();
    add(result, `${type} ${schema}.${name} (${owner})`, body);
  }
  return result;
}

// Lines of "key<TAB>definition" from the auth·storage·event trigger query.
export function extraObjects(text, result = new Map()) {
  for (const line of text.split('\n')) {
    const tab = line.indexOf('\t');
    if (tab > 0) add(result, line.slice(0, tab), line.slice(tab + 1));
  }
  return result;
}

// A repeated key would silently hide one of the two objects from the comparison.
function add(map, key, body) {
  if (map.has(key)) throw new Error(`같은 이름의 객체가 두 개 있어 비교할 수 없습니다: ${key}`);
  map.set(key, body);
}

export function differences(local, prod, skip = new Set()) {
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
