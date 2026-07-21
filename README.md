# BANG Online Store

Next.js App Router 기반의 쇼핑몰 애플리케이션입니다. 상품 탐색, 이벤트, 장바구니, 인증, 마이페이지, 고객센터 화면을 포함하며 현재 주요 데이터는 fixture repository를 통해 제공합니다.

## 개발 환경

- Node.js 24.12.0
- npm
- Next.js 16
- React 19
- TypeScript

프로젝트에 포함된 `.nvmrc`를 사용하면 권장 Node.js 버전을 선택할 수 있습니다.

## 시작하기

```bash
nvm use
npm ci
cp .env.example .env.local
chmod 600 .env.local
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 환경변수

`.env.example`을 복사한 뒤 로컬 값만 `.env.local`에 입력합니다. `.env.local`과 실제 인증정보는 Git에 커밋하지 않습니다.

| 변수 | 용도 |
| --- | --- |
| `AUTH_SECRET` | Auth.js 세션 암호화용 비밀값 |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |

서버 전용 권한을 가진 Supabase service-role 키를 `SUPABASE_ANON_KEY`에 사용하지 마세요.

## 명령어

```bash
npm run dev        # 개발 서버
npm run lint       # ESLint 검사
npm run typecheck  # TypeScript 검사
npm run build      # 프로덕션 빌드
npm run start      # 빌드 결과 실행
```

## 구조

- `src/app`: App Router 페이지와 API 라우트
- `src/components`: 공통 레이아웃과 UI 컴포넌트
- `src/features`: 화면 단위 기능
- `src/domains`: 도메인 모델, fixture, repository, service
- `src/shared`: 여러 기능에서 공유하는 코드
- `public/images`: 쇼핑몰 정적 이미지
- `docs/superpowers`: 승인된 설계 및 구현 계획

## Git 작업 방식

`main`에는 직접 기능을 개발하지 않습니다. 짧게 유지되는 기능 브랜치에서 작업하고, lint·typecheck·build를 확인한 PR만 `main`에 병합합니다.

로컬 도구 상태인 `.superpowers/`와 `.env.example`을 제외한 로컬 환경변수 파일은 Git에서 제외됩니다.
