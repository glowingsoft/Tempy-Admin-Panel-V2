// ----------------------------------------------------------------------

/*
 * Admin writes legal pages in Quill, which saves nested lists flat: one <ol>/<ul> whose sub-items
 * are <li class="ql-indent-N">. Quill numbers and indents them with its own CSS (a counter per
 * level), which only the admin editor loads — without it every item is numbered 1, 2, 3… in one
 * flat list.
 *
 * These rules number them as legal clauses instead — 1. / 1.1 / 1.1.1 — and are used both in the
 * admin editor (so what the admin types is what suppliers see) and wherever the HTML is shown
 * read-only. Selectors go through `ol > li` so they outrank Quill's own `.ql-editor li` rules.
 */
const INDENT_LEVELS = [1, 2, 3, 4];
const ALL_COUNTERS = [0, ...INDENT_LEVELS].map((level) => `list-${level}`).join(' ');

// Gutter the number hangs in: it widens with each level ("1." → "1.1" → "1.1.1").
const gutter = (level) => Math.round((1.5 + level * 1.2) * 10) / 10;

// "1." at the top level, then "1.1", "1.1.1", …
function clauseNumber(level) {
  if (level === 0) return 'counter(list-0) ". "';
  const parts = [];
  for (let n = 0; n <= level; n += 1) parts.push(`counter(list-${n})`);
  return `${parts.join(' "." ')} " "`;
}

function hangingNumber(level) {
  return {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    width: `${Math.round((gutter(level) - 0.3) * 10) / 10}em`,
    ml: `-${gutter(level)}em`,
    mr: '0.3em',
    textAlign: 'left',
  };
}

/** List rules for the lists inside `scope` ('' = the element itself, or e.g. '.ql-editor'). */
export function quillListRules(scope = '') {
  const at = (selector) => `& ${scope ? `${scope} ` : ''}${selector}`;

  const rules = {
    [at('ol')]: { pl: 0, mb: 2, counterReset: ALL_COUNTERS },
    [at('ul')]: { pl: 0, mb: 2 },
    [at('ul > li')]: { listStyleType: 'none', mb: 0.75, pl: `${gutter(0)}em` },
    [at('ul > li::before')]: { ...hangingNumber(0), content: '"\\2022"' },
    // Top-level clause: next number, and its sub-clauses start again at .1
    // `counter-set`, not `counter-reset`: a reset on a list item opens a new counter that current
    // browsers do not carry over to the following sibling items, so 2.x would continue from 1.x
    // (2.3, 2.4…). Quill's own `counter-reset` on items is cancelled for the same reason.
    [at('ol > li')]: {
      listStyleType: 'none',
      mb: 0.75,
      pl: `${gutter(0)}em`,
      counterReset: 'none',
      counterIncrement: 'list-0',
      counterSet: INDENT_LEVELS.map((level) => `list-${level} 0`).join(' '),
    },
    [at('ol > li::before')]: { ...hangingNumber(0), content: clauseNumber(0) },
  };

  INDENT_LEVELS.forEach((level) => {
    const deeper = INDENT_LEVELS.filter((n) => n > level).map((n) => `list-${n}`);
    const indent = `${level * 1.5 + gutter(level)}em`;

    rules[at(`ol > li.ql-indent-${level}`)] = {
      pl: indent,
      counterReset: 'none',
      counterIncrement: `list-${level}`,
      counterSet: deeper.length ? deeper.map((name) => `${name} 0`).join(' ') : 'none',
    };
    rules[at(`ol > li.ql-indent-${level}::before`)] = {
      ...hangingNumber(level),
      content: clauseNumber(level),
    };
    rules[at(`ul > li.ql-indent-${level}`)] = { pl: indent };
    rules[at(`ul > li.ql-indent-${level}::before`)] = hangingNumber(level);
    rules[at(`.ql-indent-${level}:not(li)`)] = { pl: `${level * 3}em` };
  });

  return rules;
}

/** Read-only display of admin-written legal HTML (Terms, Privacy, About). */
export const RICH_TEXT_SX = {
  lineHeight: 1.8,
  '& p': { mb: 2 },
  '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 3, mb: 1.25, fontWeight: 700 },
  '& a': { color: 'primary.main', fontWeight: 600 },
  '& strong, & b': { fontWeight: 700 },
  '& .ql-align-center': { textAlign: 'center' },
  '& .ql-align-right': { textAlign: 'right' },
  '& .ql-align-justify': { textAlign: 'justify' },
  ...quillListRules(),
};
