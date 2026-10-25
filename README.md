# LUUX 룩스ㅣ영업 관리

회사별 담당자 연락처와 담당자별 연락 이력을 관리하는 개인용 웹앱.

- 화면: GitHub Pages · React · TypeScript · Vite
- DB·로그인: Supabase Postgres · 이메일 로그인
- 허용된 이메일만 사용하며, 데이터는 로그인 사용자의 ID별로 분리

## 서버 연결

1. Supabase 프로젝트를 생성합니다.
2. `supabase/setup.sql`의 `owner@example.com`을 로그인 이메일로 바꾸고 SQL Editor에서 실행합니다.
3. Authentication → URL Configuration의 Site URL과 Redirect URLs에 `https://yjseo5589-create.github.io/luux-sales/`를 설정합니다.
4. `.env.example`을 `.env.local`로 복사한 후 Project URL과 Publishable key를 입력합니다.
5. `npm run build`로 `docs/`를 갱신한 뒤 변경 내용을 main 브랜치에 올립니다.
6. GitHub Settings → Pages → Source: Deploy from a branch → main /docs.

Secret key나 service_role 키는 사용하지 않습니다. 연락처, DB 덤프, 이전 파일은 저장소에 올리지 않습니다.

## 실행

Node.js 22 이상.

```sh
npm ci
cp .env.example .env.local
npm run dev
npm run build
```

## 기존 데이터 이전

운영자가 준비한 JSON 이전 파일을 로그인 후 `#migration` 화면에서 가져옵니다. 비어 있는 DB에만 가져올 수 있어 기존 데이터 덮어쓰기를 막습니다. 담당자·기록 ID를 유지하여 연락 이력이 연결됩니다.

이전 검증이 끝나기 전에는 기존 Sites 앱을 계속 사용합니다.
