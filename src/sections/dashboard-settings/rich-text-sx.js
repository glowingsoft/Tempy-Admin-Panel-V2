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
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    mb: 2,
  },
  '& th, & td': {
    border: (theme) => `1px solid ${theme.vars.palette.divider}`,
    px: 1.5,
    py: 1,
    textAlign: 'left',
    verticalAlign: 'top',
  },
  '& th': {
    fontWeight: 700,
    bgcolor: 'background.neutral',
  },
  ...quillListRules(),
  '& .terms-header': { mb: 2.5 },
  '& .terms-title': {
    typography: 'h4',
    fontWeight: 800,
    mt: 0,
    mb: 0.75,
    color: 'text.primary',
  },
  '& .terms-version': {
    m: 0,
    color: 'text.secondary',
    typography: 'body2',
  },
  '& .terms-intro': {
    mb: 3,
    color: 'text.secondary',
    typography: 'body1',
    lineHeight: 1.75,
  },
  '& .terms-key-heading': {
    typography: 'h5',
    fontWeight: 700,
    mt: 0,
    mb: 1.5,
    color: 'text.primary',
  },
  '& .terms-key-points': {
    mb: 3.5,
    border: (theme) => `1px solid ${theme.vars.palette.divider}`,
    borderRadius: 1.5,
    overflow: 'hidden',
    bgcolor: 'background.paper',
  },
  '& .terms-key-row': {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px, 28%) 1fr' },
    gap: { xs: 0.5, sm: 2 },
    px: { xs: 2, sm: 2.5 },
    py: { xs: 1.75, sm: 2 },
    borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
    alignItems: 'start',
  },
  '& .terms-key-row:last-of-type': {
    borderBottom: 'none',
  },
  '& .terms-key-row:nth-of-type(odd)': {
    bgcolor: 'background.neutral',
  },
  '& .terms-topic': {
    fontWeight: 700,
    color: 'text.primary',
    typography: 'subtitle2',
    lineHeight: 1.5,
  },
  '& .terms-detail': {
    color: 'text.secondary',
    typography: 'body2',
    lineHeight: 1.65,
  },
  '& .terms-body': { mt: 1 },
  '& .terms-section': {
    typography: 'h6',
    fontWeight: 700,
    mt: 3.5,
    mb: 1.5,
    pt: 2,
    borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`,
    color: 'text.primary',
  },
  '& .terms-body > .terms-section:first-of-type': {
    borderTop: 'none',
    pt: 0,
    mt: 2,
  },
  '& .terms-clause': {
    mb: 1.25,
    color: 'text.secondary',
    lineHeight: 1.75,
  },
  '& .terms-clause-num': {
    fontWeight: 700,
    color: 'text.primary',
    mr: 0.5,
  },
  '& .terms-para': {
    mb: 1.5,
    color: 'text.secondary',
    lineHeight: 1.75,
  },
  '& .terms-list': {
    listStyleType: 'disc',
    listStylePosition: 'outside',
    pl: 3.25,
    mb: 2.25,
    mt: 0.25,
    color: 'text.secondary',
    counterReset: 'none',
  },
  '& .terms-list > li': {
    mb: 0.85,
    pl: 0.25,
    lineHeight: 1.7,
    display: 'list-item',
    listStyleType: 'disc',
    counterIncrement: 'none',
    counterReset: 'none',
  },
  '& .terms-list > li::before': {
    content: '""',
    display: 'none',
    width: 0,
    ml: 0,
    mr: 0,
  },
  '& .terms-list--lettered': {
    listStyleType: 'none',
    pl: 2.5,
  },
  '& .terms-list--lettered > li': {
    listStyleType: 'none',
    pl: 0,
    position: 'relative',
  },
};
