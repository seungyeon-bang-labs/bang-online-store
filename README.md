# BANG Online Store

남성 패션 쇼핑몰의 상품 탐색부터 주문 후 관리까지의 사용자 경험을 구현하는 개인 포트폴리오 프로젝트입니다.

단순한 상품 목록 UI를 넘어 상품 옵션·재고·할인, 장바구니, 주문, 쿠폰, 회원 등급, 리뷰, 교환·반품처럼 쇼핑몰에서 자주 만나는 업무 흐름을 화면과 도메인 로직으로 나누어 설계하는 데 초점을 맞췄습니다.

> 현재는 UI·사용자 흐름 완성 단계입니다. 주요 데이터는 fixture repository로 제공하며, 이후 Supabase와 인증을 단계적으로 연결할 계획입니다.

## 프로젝트 목표

- Next.js App Router로 반응형 쇼핑 경험을 구현한다.
- 복잡해지기 쉬운 주문·혜택·반품 업무를 도메인 단위로 분리한다.
- 화면 구현 단계에서는 fixture로 빠르게 UX를 검증하고, 이후 실제 데이터 소스로 교체할 수 있는 구조를 만든다.
- 모바일과 데스크톱에서 일관된 탐색·구매·마이페이지 경험을 제공한다.

## 구현 범위

### 상품 탐색과 구매 흐름

- 메인 상품 슬라이더, 신상품·세일·베스트 상품
- 카테고리 및 세부 카테고리 탐색
- 상품 상세, 색상·사이즈 옵션, 재고·품절 상태, 수량 선택
- 장바구니 추가, 옵션 변경, 선택 상품 관리, 주문 데모 흐름
- 검색 오버레이와 인기·최근 검색어 UI

### 회원과 마이페이지

- 로그인, 회원가입, 계정 찾기, 이메일 인증 화면
- 주문 목록·상세·영수증, 주문 취소와 교환·반품 요청
- 배송지, 쿠폰, 포인트, 회원 등급, 최근 본 상품, 위시리스트
- 리뷰 작성·수정·삭제 및 1:1 문의 관리

### 기타

- 이벤트 목록·상세와 혜택 UI
- 고객센터, 공지, FAQ, 교환·반품 안내
- 스냅샷 피드와 업로드 화면

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI, shadcn/ui 기반 컴포넌트 |
| Form & Validation | React Hook Form, Zod |
| Client State | Zustand |
| Authentication | Supabase Auth 연동 준비 중 |
| Data | Fixture repository, Supabase 연동 준비 중 |
| UI Utilities | Embla Carousel, Sonner, Lucide Icons |

## 아키텍처

프로젝트는 App Router 위에 feature, domain, shared 계층을 둔 모듈러 모놀리스 구조입니다.

```text
src/
├─ app/       URL, 페이지, 레이아웃, API Route, Server Action
├─ features/  화면 기능과 사용자 상호작용
├─ domains/   업무 데이터, 규칙, 조회·변환 로직
└─ shared/    공통 UI, 레이아웃, 유틸리티, 타입
```

```text
app → features → domains → shared
app → domains
features → shared
```

- `app`: `(main)`, `(auth)`, `(mypage)` Route Group으로 화면 맥락을 분리합니다. 검색과 카테고리는 Parallel Route와 Intercepting Route를 이용해 오버레이 경험으로 제공합니다.
- `features`: 상품, 장바구니, 인증, 이벤트, 마이페이지처럼 사용자에게 보이는 기능 단위 UI를 관리합니다.
- `domains`: 상품·주문·회원·혜택 등 업무 개념별 DTO, repository, service, mapper, view model을 관리합니다.
- `shared`: 공통 UI, 사이트 레이아웃, 포맷터, 폼 스키마, 경로 유틸리티, 공통 타입을 관리합니다.

자세한 설계 원칙과 폴더별 책임은 [아키텍처 문서](./docs/architecture.md)에서 확인할 수 있습니다.

## 데이터 전략과 개발 단계

현재는 화면 구현과 사용자 흐름 검증에 집중하기 위해 fixture repository를 사용합니다. repository 인터페이스를 유지하므로, 화면 코드를 크게 바꾸지 않고 실제 데이터 소스로 전환할 수 있습니다.

```text
1. UI·사용자 흐름 완성         ← 현재 단계
2. 핵심 도메인 규칙과 테스트 보강
3. Supabase repository 연결
4. 실제 사용자 인증 연결
5. 서버 장바구니·주문 검증 및 배포
```

## 시작하기

### 요구 사항

- Node.js 24.12.0 (`.nvmrc` 참고)
- npm

### 설치 및 실행

```bash
nvm use
npm ci
cp .env.example .env.local
chmod 600 .env.local
npm run dev
```

개발 서버를 실행한 뒤 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 환경 변수

`.env.example`을 복사한 후 로컬 값만 `.env.local`에 입력합니다. `.env.local`과 실제 인증 정보는 커밋하지 않습니다.

| 변수 | 용도 | 현재 필요 여부 |
| --- | --- | --- |
| `SUPABASE_URL` | Supabase 프로젝트 URL | 약관 API 및 DB 연동 시 필요 |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | 약관 API 및 DB 연동 시 필요 |

`SUPABASE_ANON_KEY`에는 서버 전용 권한을 가진 service-role 키를 사용하지 않습니다.

## 명령어

```bash
npm run dev        # 개발 서버 실행
npm run lint       # ESLint 검사
npm run typecheck  # TypeScript 검사
npm run build      # 프로덕션 빌드
npm run start      # 빌드 결과 실행
```

## 문서

- [아키텍처](./docs/architecture.md): 계층별 책임, 의존성 규칙, 데이터 전환 전략

## 향후 계획

- fixture repository를 Supabase repository로 점진적으로 교체
- Supabase Auth 기반 실제 회원 인증 연결
- 장바구니와 주문 생성의 서버 검증·영속화
- 주문, 취소, 교환·반품, 쿠폰 규칙에 대한 핵심 단위 테스트 추가
