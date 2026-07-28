import type { ContentCatalog } from '$lib/content/types';

export const fixtureCatalog: ContentCatalog = {
  person: {
    id: 'hoonseok-yoon',
    canonicalUrl: 'https://hoonseokyoon.github.io/',
    editorialStatus: 'published',
    sourceLocale: 'ko',
    content: {
      ko: {
        name: 'Fixture Person',
        headline: '시간, 프로젝트, 산출물을 연결하는 개인 기록',
        summary: '이 화면은 레이아웃과 접근성을 검증하기 위한 합성 데이터입니다.'
      },
      en: {
        name: 'Fixture Person',
        headline: 'A personal record connecting time, projects, and outputs',
        summary: 'This screen uses synthetic data to verify layout and accessibility.'
      }
    },
    sameAs: ['https://example.test/profile'],
    contacts: [],
    evidence: [{ kind: 'user-confirmed', checkedAt: '2026-07-28' }]
  },
  timeline: [
    {
      id: 'fixture-project-period',
      kind: 'project',
      editorialStatus: 'published',
      period: { start: '2025-03', end: 'present' },
      sourceLocale: 'ko',
      content: {
        ko: {
          title: '합성 프로젝트 진행',
          role: '설계 및 개발',
          organization: 'Fixture Studio',
          summary: '부분 날짜와 현재 상태를 포함한 타임라인 레이아웃을 검증합니다.'
        },
        en: {
          title: 'Synthetic project in progress',
          role: 'Design and development',
          organization: 'Fixture Studio',
          summary: 'Verifies timeline layout with a partial date and present status.'
        }
      },
      projectIds: ['fixture-project'],
      outputIds: ['fixture-software'],
      knowledgeLinks: [],
      evidence: [{ kind: 'user-confirmed', checkedAt: '2026-07-28' }]
    }
  ],
  projects: [
    {
      id: 'fixture-project',
      editorialStatus: 'published',
      lifecycle: 'active',
      period: { start: '2025-03', end: 'present' },
      featuredRank: 10,
      sourceLocale: 'ko',
      content: {
        ko: {
          title: '경로와 콘텐츠 계약을 검증하는 합성 프로젝트',
          summary: '긴 한국어 제목, 선택 필드, 관련 산출물과 지식 링크가 함께 배치되는 상황을 검증합니다.',
          role: '제품 설계 및 구현',
          contributions: ['정보 구조와 콘텐츠 검증 규칙 설계', '정적 경로 및 반응형 화면 구현'],
          outcomes: ['합성 데이터만 사용하는 안전한 시각 검증 환경']
        },
        en: {
          title: 'Synthetic project for route and content-contract testing',
          summary: 'Verifies long titles, optional fields, related outputs, and knowledge links.',
          role: 'Product design and implementation',
          contributions: [
            'Designed information architecture and validation rules',
            'Implemented static routes and responsive layouts'
          ],
          outcomes: ['A visual test surface that uses synthetic data only']
        }
      },
      links: [{ kind: 'repository', url: 'https://example.test/repository' }],
      knowledgeLinks: [
        {
          kind: 'article',
          relation: 'background',
          urls: {
            ko: 'https://hoonseokyoon.github.io/tokamak/ko/blog/fixture-knowledge/',
            en: 'https://hoonseokyoon.github.io/tokamak/en/blog/fixture-knowledge/'
          },
          label: { ko: '합성 배경 지식', en: 'Synthetic background knowledge' }
        }
      ],
      evidence: [{ kind: 'user-confirmed', checkedAt: '2026-07-28' }]
    }
  ],
  outputs: [
    {
      id: 'fixture-software',
      kind: 'software',
      editorialStatus: 'published',
      date: '2026-07-28',
      sourceLocale: 'en',
      content: {
        en: {
          title: 'Fixture source package with a deliberately long canonical title',
          summary: 'Synthetic software output used to test source-language fallback.',
          contribution: 'Architecture and implementation',
          venue: 'Fixture repository'
        }
      },
      projectIds: ['fixture-project'],
      contributors: [{ person: 'self', role: 'creator' }],
      links: [
        { kind: 'repository', url: 'https://example.test/repository', primary: true },
        { kind: 'website', url: 'https://example.test/demo', primary: false }
      ],
      knowledgeLinks: [],
      evidence: [{ kind: 'user-confirmed', checkedAt: '2026-07-28' }]
    }
  ]
};
