# Hoonseok Yoon — Personal Record

`https://hoonseokyoon.github.io/`에서 개인 이력, 프로젝트, 산출물을 연결해 보여 주는
정적 웹사이트입니다. 기존 al-folio/Jekyll 템플릿을 걷어 내고 SvelteKit 기반의 자체 코드와
검증 가능한 YAML 기록으로 교체했습니다.

## 두 사이트의 역할

| 사이트                                             | 소유하는 기록                              |
| -------------------------------------------------- | ------------------------------------------ |
| [Personal Record](https://hoonseokyoon.github.io/) | 사람, 이력, 프로젝트 참여, 역할, 산출물    |
| [Tokamak](https://hoonseokyoon.github.io/tokamak/) | 학습 노트, 기술 설명, 논문 리뷰, 지식 관계 |

두 사이트는 본문을 복제하지 않습니다. 개인 사이트의 프로젝트와 산출물은 관련 Tokamak 글을
절대 URL로 참조하고, Tokamak의 저자 구조화 데이터는 개인 사이트의 고정 Person ID
`https://hoonseokyoon.github.io/#person`을 가리킵니다.

## 현재 상태와 안전 경계

- CP1의 콘텐츠 소유권/기존 경로 계약과 CP2의 정보 구조/스키마 계약이 승인되었습니다.
- CP3 프로덕션 전환은 2026-07-28에 승인되었습니다.
- Person, TimelineEvent, Project, Output 각 1개의 공개 seed가 승인되어 `published` 상태이며,
  release 콘텐츠 검증을 통과했습니다.
- 단일 social-preview 자산으로 `static/social-card.png`를 채택하고 모든 로컬라이즈 페이지의
  Open Graph/Twitter 메타데이터에 연결했습니다.
- Tokamak의 새 KO/EN calculus 글을 먼저 배포하고 라이브 검증한 뒤에만 기존 calculus URL의
  리다이렉트 게이트를 활성화했습니다.
- `published` 개인 기록은 명시적으로 확인된 사실과 근거만 허용합니다.
- GitHub Pages 배포 워크플로는 수동 실행만 지원하며, CP3 승인 확인 입력과 전체 release
  검증을 모두 통과해야 합니다.

결정 근거와 전체 경로 정책은 [`docs/migration/`](docs/migration/README.md)에 있습니다.
레거시 소스 기준점은 로컬 태그 `legacy-al-folio-990479f`로 보존합니다.

## 정보 구조

루트 `/`는 기본 언어인 `/ko/`로 이동합니다. 한국어와 영어는 같은 논리 레코드를 공유합니다.

```text
/{ko|en}/
/{ko|en}/timeline/
/{ko|en}/projects/
/{ko|en}/projects/{id}/
/{ko|en}/outputs/
```

기존 URL의 리다이렉트/404 처리와 sitemap 포함 여부는 콘텐츠 상태에서 파생되며
`tests/fixtures/legacy-route-policy.yml` 계약으로 검증합니다.

## 로컬 개발

Node.js 22를 권장합니다. 지원 범위는 `package.json`의 `engines.node`가 기준입니다.

```bash
npm ci
npx playwright install chromium
npm run dev
```

주요 명령은 다음과 같습니다.

| 명령                                    | 목적                                         |
| --------------------------------------- | -------------------------------------------- |
| `npm run check`                         | Svelte/TypeScript 정적 검사                  |
| `npm run validate:content`              | draft를 포함한 콘텐츠 스키마와 참조 검증     |
| `npm run validate:content -- --release` | 프로덕션 공개 조건과 최소 콘텐츠 게이트 검증 |
| `npm test`                              | 콘텐츠 단위 테스트                           |
| `npm run test:browser`                  | 정적 빌드 후 Playwright 브라우저 테스트      |
| `npm run check:routes`                  | 기존 80개 경로와 추가 경계 경로 정책 검증    |
| `npm run check:build`                   | 정적 산출물, 메타데이터, 링크 무결성 검증    |
| `npm run verify`                        | 위 release 검증을 포함한 전체 CI 기준 실행   |

승인된 최소 공개 seed와 social-preview를 포함한 전체 `npm run verify`가 통과했습니다. 현재
검증 기준은 단위 테스트 13개, 브라우저 테스트 18개, 로컬라이즈 정규 페이지 10개, 활성
리다이렉트 7개입니다. 상세 결과는 `docs/migration/06-implementation-status.md`에 기록합니다.

## 콘텐츠 작성

콘텐츠는 `src/lib/content/` 아래에 둡니다.

```text
src/lib/content/person.yml
src/lib/content/timeline/*.yml
src/lib/content/projects/*.yml
src/lib/content/outputs/*.yml
```

스키마와 검증 규칙은 [`docs/migration/05-content-schema.md`](docs/migration/05-content-schema.md)를
따릅니다. 초안은 `editorialStatus: draft`로 두며 공개 페이지, sitemap, JSON-LD에 포함되지
않습니다. Person과 Project의 공개 레코드는 한국어/영어 블록과 근거가 모두 필요합니다.

## CI와 수동 배포

- `.github/workflows/ci.yml`은 pull request와 기본 브랜치 push에서 `npm run verify`를 실행합니다.
- `.github/workflows/pages.yml`은 `workflow_dispatch`만 받습니다. 자동 push 배포 트리거는 없습니다.
- 저장소의 Pages publishing source를 **GitHub Actions**로 전환하고, 수동 실행 시
  `cp3_approved`를 확인해야만 `build/` 산출물이 `github-pages` 환경에 배포됩니다.
- `github-pages` 환경에는 기본 브랜치 제한과 필요한 경우 승인자 보호 규칙을 설정합니다.

CP3 실행은 Tokamak 변경을 먼저 배포하고 KO/EN calculus 대상 URL을 실제 공개 환경에서
검증한 다음, 루트의 레거시 calculus 리다이렉트를 활성화하고 루트 사이트를 전환하는 순서를
따릅니다.

배포 워크플로 자체가 Pages 설정을 대신하지 않습니다. 기본 브랜치에서 CP3 확인 입력과 전체
검증을 통과한 artifact만 배포합니다.

## License

al-folio 소스와 샘플 자산은 소스 커밋 `990479f`를 로컬 태그
`legacy-al-folio-990479f`로 보존한 뒤 구현 브랜치에서 제거했습니다. 현재 [LICENSE](LICENSE)는
마이그레이션 이후의 라이선스를 별도로 결정할 때까지 변경하지 않습니다.
