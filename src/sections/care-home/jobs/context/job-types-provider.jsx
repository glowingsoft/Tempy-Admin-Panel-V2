import { createContext, useCallback, useContext, useMemo } from 'react';

import { useRoleJobTypes } from 'src/sections/job-roles/use-role-job-types';


const JobTypesContext = createContext(null);

const EMPTY = [];

function mapApiJobType(item) {
  if (!item || typeof item !== 'object') return null;
  const id = String(item.id || item._id || '').trim();
  if (!id) return null;

  const name = String(item.title || item.name || item.label || '').trim();
  const category = String(item.department || item.category || '').trim();
  const label = String(item.label || name || '').trim();

  return {
    id,
    category,
    name,
    label,
    status: item.status,
  };
}

export function JobTypesProvider({ children, role = 'careHome' }) {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useRoleJobTypes(role);

  const jobTypes = useMemo(() => {
    const list = Array.isArray(data) ? data : EMPTY;
    return list.map(mapApiJobType).filter(Boolean);
  }, [data]);

  const jobTypeLabels = useMemo(() => jobTypes.map((item) => item.label).filter(Boolean), [jobTypes]);

  const getJobTypeById = useCallback(
    (id) => jobTypes.find((item) => String(item.id) === String(id)) || null,
    [jobTypes]
  );

  const value = useMemo(
    () => ({
      jobTypes,
      jobTypeLabels,
      getJobTypeById,
      isLoading,
      isFetching,
      isError,
      refetch,
    }),
    [jobTypes, jobTypeLabels, getJobTypeById, isLoading, isFetching, isError, refetch]
  );

  return <JobTypesContext.Provider value={value}>{children}</JobTypesContext.Provider>;
}

export function useJobTypes() {
  const context = useContext(JobTypesContext);

  if (!context) {
    throw new Error('useJobTypes must be used within JobTypesProvider');
  }

  return context;
}
