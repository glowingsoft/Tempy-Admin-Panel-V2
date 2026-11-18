function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSectionHeading(line) {
  if (line === 'Acceptance') return true;
  // "1. Booking through Tempy" — not "1.1 …"
  return /^\d+\.\s+\S/.test(line) && !/^\d+\.\d+/.test(line);
}

function isClauseLine(line) {
  return /^\d+\.\d+\s+\S/.test(line);
}

function isLetteredItem(line) {
  return /^\([a-z]\)\s+/i.test(line);
}

function isBulletCandidate(line) {
  return (
    isLetteredItem(line) ||
    /;$/.test(line) ||
    /; or$/i.test(line) ||
    /; and$/i.test(line)
  );
}

/**
 * Format clause body into readable HTML while keeping exact client wording.
 */
export function formatTermsBodyHtml(body = '') {
  const lines = String(body).split(/\r?\n/);
  const blocks = [];
  let listItems = [];
  let listKind = null; // 'lettered' | 'bullet'
  let expectList = false;

  const flushList = () => {
    if (!listItems.length) {
      expectList = false;
      listKind = null;
      return;
    }
    const className = listKind === 'lettered' ? 'terms-list terms-list--lettered' : 'terms-list';
    blocks.push(
      `<ul class="${className}">${listItems
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul>`
    );
    listItems = [];
    listKind = null;
    expectList = false;
  };

  lines.forEach((raw) => {
    const line = String(raw || '').trim();
    if (!line) {
      flushList();
      return;
    }

    if (isSectionHeading(line)) {
      flushList();
      blocks.push(`<h3 class="terms-section">${escapeHtml(line)}</h3>`);
      return;
    }

    if (isClauseLine(line)) {
      flushList();
      const match = line.match(/^(\d+\.\d+)\s+(.*)$/);
      const number = match?.[1] || '';
      const rest = match?.[2] || line;
      blocks.push(
        `<p class="terms-clause"><span class="terms-clause-num">${escapeHtml(
          number
        )}</span> ${escapeHtml(rest)}</p>`
      );
      if (rest.endsWith(':')) expectList = true;
      return;
    }

    if (expectList || listItems.length || isBulletCandidate(line)) {
      if (!listItems.length) {
        listKind = isLetteredItem(line) ? 'lettered' : 'bullet';
      } else if (listKind !== 'lettered' && isLetteredItem(line)) {
        listKind = 'lettered';
      }
      listItems.push(line);
      expectList = true;
      return;
    }

    flushList();
    blocks.push(`<p class="terms-para">${escapeHtml(line)}</p>`);
  });

  flushList();
  return blocks.join('\n');
}

/**
 * Exact client wording for title / intro / body, with Key points as readable rows.
 */
export function buildTermsDisplayHtml({ title, subtitle, intro, keyPoints = [], body }) {
  const rows = keyPoints
    .map(
      ([topic, detail]) =>
        `<div class="terms-key-row"><div class="terms-topic">${escapeHtml(
          topic
        )}</div><div class="terms-detail">${escapeHtml(detail)}</div></div>`
    )
    .join('');

  return [
    `<header class="terms-header">`,
    `<h1 class="terms-title">${escapeHtml(title)}</h1>`,
    `<p class="terms-version">${escapeHtml(subtitle)}</p>`,
    `</header>`,
    `<p class="terms-intro">${escapeHtml(intro)}</p>`,
    `<h2 class="terms-key-heading">Key points</h2>`,
    `<div class="terms-key-points">${rows}</div>`,
    `<div class="terms-body">${formatTermsBodyHtml(body)}</div>`,
  ].join('\n');
}
