#!/usr/bin/env bash
# 운영 DB를 읽기만 한다. 비밀번호는 pg_dump가 직접 묻고, 어디에도 저장하지 않는다.
# 결과는 저장소 밖 임시 폴더에 둔다. 로컬 베이스라인과 카탈로그 seed를 다시 만들 때만 쓴다.
set -euo pipefail

: "${PROD_DB_URL:?PROD_DB_URL(비밀번호 없는 session pooler 주소)이 필요합니다}"
if [[ "$PROD_DB_URL" =~ ://[^/@]+:[^/@]+@ ]]; then
  echo "연결 문자열에 비밀번호를 넣지 마세요. 실행 중에 입력합니다." >&2
  exit 1
fi

OUT_DIR="${TMPDIR:-/tmp}/bang-prod-dump"
mkdir -p "$OUT_DIR"
IMAGE=public.ecr.aws/supabase/postgres:17.6.1.087
# 회원·장바구니·주문·배송지는 넣지 않는다. 할인·진열·집계는 기존 merchandising seed가 넣는다.
TABLES=(categories colors product_styles products product_variants product_images term_codes terms)
TABLE_ARGS=()
for table in "${TABLES[@]}"; do TABLE_ARGS+=(-t "public.$table"); done

run() { docker run --rm -it -v "$OUT_DIR:/out" "$IMAGE" "$@"; }

echo "운영 스키마를 받습니다. 비밀번호를 입력하세요."
run pg_dump "$PROD_DB_URL" -W --schema-only --schema=public --schema=private -f /out/schema.sql
echo "카탈로그 데이터를 받습니다. 비밀번호를 한 번 더 입력하세요."
run pg_dump "$PROD_DB_URL" -W --data-only --column-inserts "${TABLE_ARGS[@]}" -f /out/catalog.sql

echo "저장 위치: $OUT_DIR (schema.sql, catalog.sql)"
