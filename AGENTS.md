# BANG Online Store

작업을 시작할 때 `docs/STATUS.md`를 읽어 현재 상태를 파악한다. 작업은 사용자가 지시한 항목만 시작한다.

## 세션별 절차

- 할 일 정리 세션: 사용자가 문제나 기능을 지적하면 `.claude/skills/todo-triage/SKILL.md`를 따른다.
- 구현 세션: 착수 전에 항목의 확인 근거가 지금도 맞는지 재확인한다. 작업이 끝나면 `docs/STATUS.md`의 규칙대로 갱신한다.

## 먼저 읽을 문서

- Git 상태를 바꾸기 전: `docs/codex/git-workflow.md`
- DB migration을 만들거나 운영에 적용하기 전: `supabase/README.md`
- 기존 기능의 결정 배경이 필요할 때: `docs/superpowers/specs/` (작성 당시 기준이며, 코드와 다르면 코드를 따른다)
- 실행 방법과 데이터 출처: `README.md`

`docs/`는 git에서 제외된 로컬 전용 폴더다. worktree에서는 `git worktree list`의 첫 경로에서 읽는다.

## 지킬 규칙

- 브랜치, 커밋, push, PR, 병합은 정확한 이름과 전체 문구를 그 메시지에 보여 주고, 명시적 승인을 받은 뒤 실행한다.
- 커밋 메시지와 PR 본문에는 사람이 쓴 내용만 남긴다. `Co-Authored-By`와 생성 도구 표기는 넣지 않는다.
- 운영 DB 변경은 사용자 승인 후 Supabase SQL Editor에서 migration을 하나씩 적용하고, `supabase/README.md`에 기록한다.
- 공개 저장소이므로, 커밋되는 파일에는 비밀값과 보안 취약점 재현 방법을 남기지 않는다.

## PR 전 검사

```sh
npm run lint
npm run typecheck
npm run build
node --test tests/*.test.mjs
```

DB 테스트는 격리 컨테이너 환경변수가 없으면 건너뛴다. 실행 명령은 `supabase/README.md`에 있다.
