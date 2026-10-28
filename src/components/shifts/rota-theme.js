

export function rotaPaper(theme) {
  return theme.palette.mode === 'dark' ? theme.vars.palette.background.paper : '#fff';
}

export function rotaMuted(theme) {
  return theme.palette.mode === 'dark' ? theme.vars.palette.background.neutral : '#fafafa';
}

export function rotaWash(theme) {
  return theme.palette.mode === 'dark' ? theme.vars.palette.background.neutral : '#eeeeee';
}

export function rotaHover(theme) {
  return theme.palette.mode === 'dark' ? theme.vars.palette.action.hover : '#f5f5f5';
}

export function rotaSelected(theme) {
  return theme.palette.mode === 'dark' ? theme.vars.palette.primary.lighter : '#e3f2fd';
}

export function rotaRowActive(theme) {
  return theme.palette.mode === 'dark' ? theme.vars.palette.success.lighter : '#f9fdf7';
}

export function rotaSoftSuccess(theme) {
  return theme.palette.mode === 'dark' ? theme.vars.palette.success.lighter : '#e8f5e9';
}

export function rotaSoftSuccessBg(theme) {
  return theme.palette.mode === 'dark' ? theme.vars.palette.success.lighter : '#f1f8e9';
}

export function rotaBorderColor(theme) {
  return theme.palette.mode === 'dark' ? theme.vars.palette.divider : '#e0e0e0';
}

export function rotaBorder(theme) {
  return `1px solid ${rotaBorderColor(theme)}`;
}
