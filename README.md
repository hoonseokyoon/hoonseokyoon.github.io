# Hoonseok Yoon — Curriculum vitae

`https://hoonseokyoon.github.io/` 에서 이력, 프로젝트, 산출물, 관심 분야를 보여 주는
SvelteKit 정적 사이트입니다. 홈이 곧 CV이고, 모든 내용은 검증되는 YAML 기록에서 나옵니다.

## 두 사이트의 역할

| 사이트                                              | 소유하는 기록                              |
| --------------------------------------------------- | ------------------------------------------ |
| [Curriculum vitae](https://hoonseokyoon.github.io/) | 사람, 이력, 프로젝트 참여, 역할, 산출물    |
| [Tokamak](https://hoonseokyoon.github.io/tokamak/)  | 학습 노트, 기술 설명, 논문 리뷰, 지식 관계 |

두 사이트는 본문을 복제하지 않습니다. 이 사이트의 프로젝트와 산출물은 관련 Tokamak 지식을
절대 URL로 참조하고, Tokamak의 저자 구조화 데이터는 이 사이트의 고정 Person ID
`https://hoonseokyoon.github.io/#person` 을 가리킵니다.

**디자인은 의도적으로 서로 다릅니다.** Tokamak은 지식 관리용 위키라서 차가운 파랑, 작은
본문, 사이드바와 카드로 되어 있습니다. 이쪽은 이력 관리용 CV라서 따뜻한 종이색, 명조 표제,
모노스페이스 라벨, 그리고 카드 대신 얇은 괘선만 씁니다. 두 사이트의 CSS는 공유하지 않습니다.

## 디자인 원칙

`src/lib/styles/global.css` 하나가 전체 시스템입니다.

1. 카드·패널·그림자·둥근 모서리 없음. 구조는 괘선과 여백으로만 만듭니다.
2. 강조색은 하나(`#8c3a1c`)뿐이고 따뜻한 색입니다. 링크는 파랑이 아니라 밑줄로 구분합니다.
3. 표제는 명조(serif), 본문은 고딕(sans), 날짜와 라벨은 모노스페이스입니다.
4. 날짜는 항상 정렬되는 숫자로, 모든 섹션은 비면 사라집니다.
5. 라이트 모드 전용입니다. "인쇄된 문서"라는 정체성이 곧 디자인입니다. 실제로
   인쇄 스타일시트도 함께 들어 있습니다.

레이아웃 기본 단위는 **원장(ledger)** 하나입니다. 왼쪽 여백에 날짜, 오른쪽에 기록,
사이에 얇은 선. 이력·프로젝트·산출물이 모두 같은 구조를 씁니다.

## 정보 구조

루트 `/` 는 기본 언어인 `/ko/` 로 이동합니다. 한국어와 영어는 같은 논리 레코드를 공유합니다.

```text
/{ko|en}/                  CV — 소개, 관심 분야, 현재, 이력, 프로젝트, 산출물, 기술, 지식
/{ko|en}/timeline/
/{ko|en}/projects/
/{ko|en}/projects/{id}/
/{ko|en}/outputs/
```

## 로컬 개발

Node.js 22를 권장합니다.

```bash
npm ci
npx playwright install chromium
npm run dev
```

| 명령                       | 목적                                  |
| -------------------------- | ------------------------------------- |
| `npm run check`            | Svelte/TypeScript 정적 검사           |
| `npm run validate:content` | 콘텐츠 스키마와 참조 검증             |
| `npm test`                 | 콘텐츠 단위 테스트                    |
| `npm run test:browser`     | 정적 빌드 후 Playwright 스모크 테스트 |
| `npm run verify`           | 위 전부 (CI 기준)                     |
| `npm run social-card`      | `static/social-card.png` 재생성       |
| `npm run format`           | Prettier                              |

## 콘텐츠 작성

콘텐츠는 `src/lib/content/` 아래 YAML입니다. 스키마와 규칙은
[`docs/content-model.md`](docs/content-model.md)를 보세요.

핵심만 요약하면:

- 초안은 `editorialStatus: draft`로 두면 공개 페이지·sitemap·JSON-LD 어디에도 나오지 않습니다.
- `published` 기록은 날짜가 찍힌 `user-confirmed` 근거가 있어야 합니다.
- Person과 Project의 공개 기록은 한국어·영어 블록이 모두 필요합니다.
- CV 섹션(관심 분야, 기술)은 `person.yml`의 `focus`와 `expertise`에서 나옵니다.

## 배포

- `.github/workflows/ci.yml` — pull request와 `master` push에서 `npm run verify`.
- `.github/workflows/pages.yml` — `master` push에서 GitHub Pages로 배포.
  저장소의 Pages publishing source가 **GitHub Actions**여야 합니다.

Tokamak과의 상호 링크를 바꿀 때는 Tokamak을 먼저 배포한 뒤 이 저장소를 배포합니다.

## License

[LICENSE](LICENSE)를 따릅니다.
