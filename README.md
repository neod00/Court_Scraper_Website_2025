This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 자동 발행(주간 칼럼·월간 리포트)

주간 칼럼(`/trend/{week_start}`)과 월간 리포트(`/reports/{YYYY-MM}`)는 GitHub Actions 가 로옥션(LawAuction)이 수집한 공고 집계만을 근거로 자동 작성하고, 본문을 검증한 뒤 발행합니다. 사이트는 이 글들을 "자동 작성"으로 표시하며(작성자 표기: 로옥션 데이터 데스크), 원인 해석·조언·전망은 담지 않습니다. 블로그·FAQ·용어집 등 편집 글은 자동 발행 대상이 아니며 사람이 작성합니다.

### 무엇이 언제 실행되나요 (KST 기준)

| 워크플로 | 실행 시각 | 하는 일 | 결과가 저장되는 곳 |
| --- | --- | --- | --- |
| `weekly_ai_report.yml` | 매주 금요일 23:00 | 직전 주(월~금) 집계 행 생성 (`weekly_trend_generator.py`) | Supabase `weekly_reports` |
| `weekly_column.yml` | 매주 토요일 09:30 | 가장 최근 미작성 주차 1편 + 2026-08-03 이후 과거 주차 1편을 자동 작성·검증·발행 (`write_weekly_column.py --auto`) | Supabase `weekly_reports.editor_note*` (`editor_note_by = 로옥션 데이터 데스크`) |
| `monthly_report.yml` | 매월 2일 10:00 | 직전 달 집계 → 노트 자동 작성·검증 → 발행 (`monthly_report_builder.py --auto-publish YYYY-MM`) | `src/content/reports/YYYY-MM.json`, `index.ts` 를 봇이 커밋·푸시 |
| `monthly_report.yml` | 매주 일요일 10:00 | 아직 발행되지 않은 가장 오래된 과거 달 1편만 발행 (`--auto-next`). 일요일이 2일과 겹치면 이 실행은 건너뜁니다(하루 1편) | 위와 같음 |

모든 워크플로는 Actions 탭에서 수동 실행(workflow_dispatch)할 수 있습니다. `weekly_column.yml` 은 `week`(YYYY-MM-DD, 월요일)와 `dry_run`, `monthly_report.yml` 은 `month`(YYYY-MM)와 `dry_run` 입력을 받습니다. `dry_run` 을 켜면 생성·검증 결과만 로그에 출력하고 아무것도 저장·커밋하지 않습니다.

필요한 저장소 Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`. 월간 리포트 워크플로는 `contents: write` 권한으로 `src/content/reports` 만 커밋합니다. 봇이 `GITHUB_TOKEN` 으로 `main` 에 직접 푸시하므로, `main` 에 PR 필수·상태 검사 필수 같은 branch protection 이 걸려 있으면 푸시 단계가 실패합니다. 이 경우 규칙에서 GitHub Actions 를 예외로 두거나 규칙을 완화해야 합니다. 봇 푸시는 Vercel 배포는 트리거하지만 다른 Actions 워크플로는 트리거하지 않습니다.

### 발행 전 검증(guard)

자동 작성된 본문은 `scripts/column_guard.py` 의 검사를 모두 통과해야만 저장됩니다. 통과하지 못하면 최대 3회까지 문제점을 피드백해 다시 쓰고, 그래도 실패하면 발행하지 않습니다.

- 본문의 모든 숫자·사건번호가 집계 데이터(payload)에 있는 값과 일치하는지 확인합니다.
- 금지 표현(낙찰가율, 경쟁률, 수익률, 투자 기회, 주목, 추천, 저렴, 블루오션, 노하우, 유망, 기회)과 원인 단정 표현(~때문, ~영향으로, ~로 보입니다, 추정, 전망 등)을 차단합니다.
- 해당 기간 공고에서 추출한 개인명(채무자·채권자·관재인 등)이 본문에 나오면 차단합니다.
- 길이(주간 500~800자, 월간 노트 400~700자), 문단 수(3~4개), 마크다운 기호 없음, 데이터 한계 언급 여부를 확인합니다.
- 별도의 LLM 사실 확인 단계에서 비교·법원명·분류명이 데이터로 뒷받침되는지 다시 봅니다.

주간 칼럼이 검증에 실패하면 `drafts/weekly-columns/{week}.auto-failed.md` 가 Actions 아티팩트(`weekly-column-auto-failed`)로 올라오고, 워크플로는 실패로 끝납니다(같은 실행에서 통과한 다른 주차는 그대로 발행됩니다).

### 멈추는 방법

- 저장소 Settings → Secrets and variables → Actions → Variables 에 `AUTO_PUBLISH_DISABLED` = `true` 를 추가합니다. 두 스크립트 모두 이 값을 보면 아무것도 하지 않고 정상 종료합니다. 다시 켜려면 변수를 지우거나 값을 바꿉니다.
- 또는 Actions 탭에서 해당 워크플로를 Disable workflow 로 비활성화합니다.

### 발행된 글을 고치는 방법

주간 칼럼(로컬에서 `.env.local` 필요):

```bash
python scripts/write_weekly_column.py --unpublish 2026-08-31   # 색인에서 즉시 제외
# drafts/weekly-columns/2026-08-31.md 를 열어 본문을 고친다 (없으면 --draft 2026-08-31 --blank 로 생성)
python scripts/write_weekly_column.py --publish 2026-08-31     # 고친 본문으로 다시 발행
```

초안 파일 머리의 `작성자:` 줄이 `editor_note_by` 로 저장됩니다. 사람이 고쳐서 다시 발행하면 기본값 `로옥션` 이 들어가 사이트의 "자동 작성" 표시가 사라지며, 자동 작성 표시를 유지하려면 `작성자: 로옥션 데이터 데스크` 로 적습니다.

월간 리포트:

```bash
python scripts/monthly_report_builder.py --set-note 2026-08 --file 노트.txt   # 고친 노트 저장 (reviewed 로 표시)
python scripts/monthly_report_builder.py --publish 2026-08 --reviewed
git add src/content/reports && git commit -m "content(report): 2026-08 정정" && git push
```

정정한 내용은 사이트의 정정 이력(`/authors/lawauction-editorial-team`)에 남깁니다. 자동 발행 흐름의 세부 동작은 각 스크립트 상단 docstring(`python scripts/write_weekly_column.py --help`, `python scripts/monthly_report_builder.py --help`)을 참고하세요.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
