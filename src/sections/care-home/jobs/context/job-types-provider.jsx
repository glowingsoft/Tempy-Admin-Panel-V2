import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  createJobType,
  loadJobTypes,
  parseJobTypeLabel,
  saveJobTypes,
} from '../care-home-job-types-utils';

const JobTypesContext = createContext(null);

function buildSeedJobTypes(seedLabels = []) {
  return seedLabels.map((label, index) => {
    const trimmed = String(label).trim();
    if (trimmed.includes(' · ')) {
      const { category, name } = parseJobTypeLabel(trimmed);
      return createJobType({
        id: `job-type-seed-${index}`,
        category,
        name,
      });
    }
    return {
      id: `job-type-seed-${index}`,
      category: 'Individual',
      name: trimmed,
      label: trimmed,
    };
  });
}

export function JobTypesProvider({ children, seedLabels = null, storageKey = null }) {
  const [jobTypes, setJobTypes] = useState(() => {
    if (seedLabels?.length) {
      if (storageKey) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) {
              return parsed.map((item) =>
                createJobType({
                  id: item.id,
                  category: item.category,
                  name: item.name,
                })
              );
            }
          }
        } catch {
          // fall through to seed
        }
      }
      return buildSeedJobTypes(seedLabels);
    }
    return loadJobTypes();
  });

  const persist = useCallback(
    (nextJobTypes) => {
      setJobTypes(nextJobTypes);
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(nextJobTypes));
        return;
      }
      if (!seedLabels?.length) {
        saveJobTypes(nextJobTypes);
      }
    },
    [seedLabels, storageKey]
  );

  const addJobType = useCallback(
    ({ category, name }) => {
      const nextType = createJobType({ category, name });
      persist([nextType, ...jobTypes]);
      return nextType;
    },
    [jobTypes, persist]
  );

  const updateJobType = useCallback(
    (id, { category, name }) => {
      persist(
        jobTypes.map((item) =>
          item.id === id
            ? createJobType({ id, category, name })
            : item
        )
      );
    },
    [jobTypes, persist]
  );

  const deleteJobType = useCallback(
    (id) => {
      persist(jobTypes.filter((item) => item.id !== id));
    },
    [jobTypes, persist]
  );

  const getJobTypeById = useCallback(
    (id) => jobTypes.find((item) => item.id === id) || null,
    [jobTypes]
  );

  const jobTypeLabels = useMemo(() => jobTypes.map((item) => item.label), [jobTypes]);

  const value = useMemo(
    () => ({
      jobTypes,
      jobTypeLabels,
      addJobType,
      updateJobType,
      deleteJobType,
      getJobTypeById,
    }),
    [jobTypes, jobTypeLabels, addJobType, updateJobType, deleteJobType, getJobTypeById]
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
