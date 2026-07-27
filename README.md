<p align="center">
  <img width="200" alt="Image" src="https://github.com/user-attachments/assets/2e6cd3b7-7d32-4c7e-8690-9eaaa620453f" />
</p>

<div align="center">
  
### 내 근처 토익 시험장 찾기

토익 시험장, 신청할 때 마다 근처 시험장을 찾느라 고생하셨나요?   
현재 위치 기준 고사장 위치를 정렬해주는 웹사이트를 만나보세요!

<br/>

<img width="800" alt="Image" src="https://github.com/user-attachments/assets/b8f833bc-9620-4b81-b2df-009e5341f55c" />
   

**내 근처 토익 시험장 찾으러 가기!**   
https://toeic.roundtable02.com/

*토익 홈페이지가 점검 중인 경우 오류가 발생할 수 있습니다.*


</div>


---
### 기술 스택


**[ 해당 웹사이트는 AI와 함께 개발하였습니다. ]**

[![My Skills](https://skillicons.dev/icons?i=html,css,ts,nextjs,react,vercel)](https://skillicons.dev)

<br/>

[[개발 여행기1 - 내 근처에 있는 토익 시험장이 궁금하다]](https://velog.io/@_roundtable/%EB%B9%84%EB%B0%94%EC%9D%B4%EB%B9%99-%ED%86%A0%EC%9D%B5-%EC%8B%9C%ED%97%98%EC%9E%A5-%EC%B0%BE%EA%B8%B0-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-1)

[[개발 여행기2 - 도메인 네임이 맘에 안들어서 어쩌지 (EC2 인스턴스 + nginx 도입기)]](https://velog.io/@_roundtable/%EB%B9%84%EB%B0%94%EC%9D%B4%EB%B9%99-%ED%86%A0%EC%9D%B5-%EC%8B%9C%ED%97%98%EC%9E%A5-%EC%B0%BE%EA%B8%B0-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-2)

[[개발 여행기3 - EC2 인스턴스에 React 도커로 배포하기]](https://velog.io/@_roundtable/%ED%86%A0%EC%9D%B5-%EC%8B%9C%ED%97%98%EC%9E%A5-%EC%B0%BE%EA%B8%B0-3-React-%EB%8F%84%EC%BB%A4%EB%A1%9C-%EB%B0%B0%ED%8F%AC%ED%95%98%EA%B8%B0)

[[개발 여행기4 - Functions 대신 Express.js 서버로 CORS 해결하기]](https://velog.io/@_roundtable/%ED%86%A0%EC%9D%B5-%EC%8B%9C%ED%97%98%EC%9E%A5-%EC%B0%BE%EA%B8%B0-4-Express.js%EC%84%9C%EB%B2%84%EB%A1%9C-CORS-%ED%95%B4%EA%B2%B0%ED%95%98%EA%B8%B0)

<br/>

- Next.js App Router
- React 19
- TypeScript
- styled-components
- Leaflet / react-leaflet
- Playwright
- Vercel

## 로컬 실행

```bash
npm install
npm run dev
```

앱은 기본적으로 `http://127.0.0.1:3000` 에서 실행됩니다.

## 환경변수

`.env.example` 기준:

```bash
NEXT_PUBLIC_SITE_URL=https://toeic.roundtable02.com
TOEIC_UPSTREAM_BASE_URL=https://m.exam.toeic.co.kr/receipt/centerMapProc.php
TOEIC_PROXY_TIMEOUT_MS=15000
```

- `NEXT_PUBLIC_SITE_URL`: canonical, OG, sitemap, robots 기준 URL
- `TOEIC_UPSTREAM_BASE_URL`: TOEIC 프록시 대상 엔드포인트
- `TOEIC_PROXY_TIMEOUT_MS`: 프록시 타임아웃(ms)

## 검증

기본 검증은 mock upstream 기반 Playwright E2E입니다.

```bash
npm run test:centers
npm run build
npm run test:e2e
```

실서비스 스모크는 수동 실행용입니다.

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e:live
```

`test:e2e:live` 실행 전에는 실제 upstream 을 바라보는 앱 서버가 이미 떠 있어야 합니다.

## 시험장 CSV 자동 갱신

정적 CSV는 자동 갱신 스크립트로 유지합니다.

```bash
npm run centers:check
npm run centers:refresh
```

- `centers:check`
  - 현재 CSV, 리포트, 상태 파일과 비교만 수행합니다.
  - 저장소 파일은 수정하지 않고, 변경이 있으면 종료 코드 `1` 을 반환합니다.
- `centers:refresh`
  - 공식 TOEIC upstream 을 기준으로 `public/toeic_centers.csv` 를 갱신합니다.
  - 검색 랜딩 페이지의 장애 대비 스냅샷인 `data/toeic-landings.json` 을 누적 갱신합니다.
  - 리포트와 상태 파일도 함께 갱신합니다.

CLI 옵션:

```bash
node scripts/update-toeic-centers.mjs --check
node scripts/update-toeic-centers.mjs --csv public/toeic_centers.csv
node scripts/update-toeic-centers.mjs --report reports/toeic-centers-report.json
node scripts/update-toeic-centers.mjs --landing-archive data/toeic-landings.json
```

- `--check`: 쓰기 없이 비교만 수행
- `--csv <path>`: 대상 CSV 경로
- `--report <path>`: JSON 리포트 경로
  - 같은 basename 으로 Markdown 리포트도 함께 생성됩니다.
- `--landing-archive <path>`: 날짜·지역별 공식 시험장 스냅샷 경로

리포트 파일:

- `reports/toeic-centers-report.json`
  - `newCenters[]`, `staleCenters[]`, `changedMetadata[]`, `manualReview[]` 포함
- `reports/toeic-centers-report.md`
  - 사람이 읽기 쉬운 요약
- `reports/toeic-centers-state.json`
  - 다음 실행에서 이름/주소 변경을 감지하기 위한 내부 상태 파일

정책:

- 기준 범위는 앱 드롭다운에 실제로 노출되는 모든 시험일입니다.
- 신규 센터는 CSV 끝에 자동 append 합니다.
- 공식 목록에서 사라진 센터는 CSV에서 삭제하지 않고 `stale candidate` 로만 보고합니다.
- 공식 좌표가 비어 있거나 비정상 형식이면 CSV에 자동 추가하지 않고 `manualReview` 로 남깁니다.

## Vercel 배포

- Vercel 프로젝트 루트는 저장소 루트(`/Users/tak/toeic-center-finder`)입니다.
- Framework Preset 은 Next.js 를 사용합니다.
- 프로덕션 환경변수 `NEXT_PUBLIC_SITE_URL` 은 반드시 `https://toeic.roundtable02.com` 으로 설정합니다.
- 필요 시 `TOEIC_PROXY_TIMEOUT_MS` 를 운영 환경에 맞춰 조정합니다.
- 로컬 CLI 링크 기준 프로젝트 정보는 `.vercel/project.json` 에 생성되며, GitHub Actions 에서는 같은 값을 시크릿으로 사용합니다.
- 과거 보조 도메인을 다시 연결하더라도 canonical, sitemap, robots, OG 기준 URL은 항상 `https://toeic.roundtable02.com` 하나만 사용합니다.

## GitHub Actions Vercel 자동 배포

- `.github/workflows/vercel-preview.yml`
  - PR 오픈/업데이트 시 preview 배포
  - draft PR 과 포크 PR 은 시크릿 보호를 위해 자동 배포하지 않음
- `.github/workflows/vercel-production.yml`
  - `main` 브랜치 push 시 production 배포
  - 수동 실행(`workflow_dispatch`) 가능

GitHub repository secrets:

```bash
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

설정 순서:

1. Vercel에서 access token 을 발급합니다.
2. 로컬에서 `vercel link` 를 실행해 프로젝트를 연결합니다.
3. 생성된 `.vercel/project.json` 에서 `orgId`, `projectId` 값을 확인합니다.
4. GitHub 저장소의 `Settings > Secrets and variables > Actions` 에 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` 를 등록합니다.
5. Vercel 프로젝트 환경변수에도 `NEXT_PUBLIC_SITE_URL`, 필요 시 `TOEIC_PROXY_TIMEOUT_MS` 를 등록합니다.

운영 메모:

- 이 자동화는 Vercel 공식 GitHub Actions 방식인 `vercel pull` + `vercel build` + `vercel deploy --prebuilt` 흐름을 사용합니다.
- 나중에 Vercel Git Integration 을 연결하면 GitHub Actions 와 중복 배포가 생길 수 있으니 한쪽만 활성화하는 편이 안전합니다.
- `main` 브랜치에는 GitHub Branch Protection 을 걸고 `CI` 워크플로 성공을 필수 status check 로 두는 편이 안전합니다.

## GitHub Actions 자동 갱신

- `.github/workflows/refresh-toeic-centers.yml`
  - 주 1회 실행
  - 수동 실행(`workflow_dispatch`) 가능
  - 변경이 있으면 CSV/리포트/상태 파일을 담은 PR을 자동 생성

## 참고 문서

- [Vercel + Next.js 마이그레이션 가이드](docs/vercel-nextjs-migration.md)
