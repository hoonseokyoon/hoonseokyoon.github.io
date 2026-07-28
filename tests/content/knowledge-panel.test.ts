import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import KnowledgePanel from '../../src/lib/components/KnowledgePanel.svelte';

describe('KnowledgePanel server rendering', () => {
  it('emits an absolute localized link in server HTML without client JavaScript', () => {
    const { body } = render(KnowledgePanel, {
      props: {
        links: [
          {
            relation: 'documents',
            href: 'https://hoonseokyoon.github.io/tokamak/en/categories/fixture-output-notes/',
            locale: 'en',
            label: 'Synthetic output notes'
          }
        ],
        lang: 'ko',
        headingId: 'output-fixture-knowledge-title',
        headingLevel: 4,
        variant: 'compact'
      }
    });

    expect(body).toContain('aria-labelledby="output-fixture-knowledge-title"');
    expect(body).toContain('id="output-fixture-knowledge-title"');
    expect(body).toContain('lang="ko"');
    expect(body).toContain('작업을 설명하는 지식');
    expect(body).toContain(
      'href="https://hoonseokyoon.github.io/tokamak/en/categories/fixture-output-notes/" lang="en"'
    );
    expect(body).not.toContain('<script');
  });

  it('emits no panel for an empty relationship list', () => {
    const { body } = render(KnowledgePanel, {
      props: {
        links: [],
        lang: 'ko',
        headingId: 'empty-knowledge-title'
      }
    });

    expect(body).not.toContain('empty-knowledge-title');
    expect(body).not.toContain('knowledge-links');
  });
});
