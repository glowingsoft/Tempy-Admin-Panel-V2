import { usePathname } from './use-pathname';
import { hasParams, removeParams, isExternalLink, removeLastSlash } from '../utils';

// ----------------------------------------------------------------------

export function checkActiveLink(pathname, itemPath, deep = true) {
  const normalizedPathname = removeLastSlash(pathname ?? '');

  const pathHasParams = hasParams(itemPath);

  const notValid = itemPath?.startsWith('#') || isExternalLink(itemPath);

  if (notValid) {
    return false;
  }

  const isDeep = deep || pathHasParams;

  if (isDeep) {
    const defaultActive = normalizedPathname.includes(removeLastSlash(itemPath));

    const originItemPath = removeParams(itemPath);

    const hasParamsActive = pathHasParams && originItemPath === normalizedPathname;

    return defaultActive || hasParamsActive;
  }

  return normalizedPathname === removeLastSlash(itemPath);
}

export function hasActiveNavDescendant(pathname, children) {
  if (!children?.length) {
    return false;
  }

  return children.some((child) => {
    if (checkActiveLink(pathname, child.path, child.deep ?? !!child.children)) {
      return true;
    }

    return hasActiveNavDescendant(pathname, child.children);
  });
}

export function useActiveLink(itemPath, deep = true) {
  const pathname = removeLastSlash(usePathname());

  return checkActiveLink(pathname, itemPath, deep);
}

export function useNavListActive(data) {
  const pathname = usePathname();
  const active = useActiveLink(data.path, data.deep ?? !!data.children);
  const hasActiveChild = hasActiveNavDescendant(pathname, data.children);

  return active || hasActiveChild;
}
