import { BRANCH_STATUS } from './branches-constants';

/**
 * Legacy local branch helpers — kept empty / no-op.
 * All dashboards must use the role branch APIs (no localStorage / demo rows).
 */

export function getBranches() {
  return [];
}

export function setBranches() {
  return [];
}

export function createBranch() {
  return null;
}

export function updateBranch() {
  return null;
}

export function deleteBranch() {
  return [];
}

export function getBranchesAsLocations() {
  return [];
}

// Re-export so old imports of status from this file still resolve if any remain.
export { BRANCH_STATUS };
