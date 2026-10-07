export const TEMPY_NAV_OFFSET = 80;

export const TEMPY_SECTION_SCROLL_SX = {
  scrollMarginTop: `${TEMPY_NAV_OFFSET}px`,
};

export const TEMPY_NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'How It Works', to: '/', hash: 'how-it-works' },
  { label: 'Services', to: '/', hash: 'services' },
  { label: 'Help', to: '/', hash: 'help' },
  { label: 'About Us', to: '/', hash: 'about' },
];

export function scrollToTempySection(hash) {
  const id = hash?.replace(/^#/, '');
  if (!id) return false;

  const element = document.getElementById(id);
  if (!element) return false;

  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

export function getTempyNavHref(link) {
  if (link.hash) {
    return `/#${link.hash}`;
  }
  return link.to;
}
