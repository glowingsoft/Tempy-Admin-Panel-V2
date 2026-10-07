import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { _staffList, createStaffRecord } from 'src/_mock/_staff';


const StaffContext = createContext(null);


function generateStaffId(existingList) {
  const maxNumber = existingList.reduce((max, staff) => {
    const num = parseInt(staff.id.replace('N', ''), 10);
    return Number.isNaN(num) ? max : Math.max(max, num);
  }, 0);

  return `N${String(maxNumber + 1).padStart(3, '0')}`;
}

function resolveFilePreview(file, index = 0) {
  if (!file) return { name: `document-${index + 1}`, preview: '' };
  if (file?.name && file?.preview) return file;
  if (file instanceof File) {
    return { name: file.name, preview: URL.createObjectURL(file) };
  }
  if (typeof file === 'string') return { name: `document-${index + 1}`, preview: file };
  return { name: `document-${index + 1}`, preview: '' };
}

function resolveAvatarUrl(avatar) {
  if (!avatar) return '';
  if (typeof avatar === 'string') return avatar;
  if (avatar instanceof File) return URL.createObjectURL(avatar);
  return '';
}

function mapDocumentsFromForm(data) {
  const toDocList = (files) => (files || []).map((file, index) => resolveFilePreview(file, index));

  return {
    governmentId: toDocList(data.governmentId),
    nursingDegree: toDocList(data.nursingDegree),
    certifications: toDocList(data.certifications),
  };
}


export function StaffProvider({ children }) {
  const [staffList, setStaffList] = useState(_staffList);

  const getStaffById = useCallback(
    (id) => staffList.find((staff) => staff.id === id) || null,
    [staffList]
  );

  const addStaff = useCallback(
    (data) => {
      const id = generateStaffId(staffList);
      const addedOn = new Date().toISOString().slice(0, 10);

      const newStaff = createStaffRecord({
        id,
        name: data.name,
        email: data.email,
        phone: data.phoneNumber,
        phoneVerified: false,
        gender: data.gender,
        location: data.location,
        taxNumber: data.taxNumber,
        specialities: data.specialty || ['generalNurse'],
        specialty: data.specialty?.[0] || 'generalNurse',
        ratePerHour: Number(data.ratePerHour) || 0,
        platformPercent: Number(data.platformPercent) ?? 10,
        addedOn,
        joinedOn: addedOn,
        weeklyEarning: 0,
        avatarUrl: resolveAvatarUrl(data.avatarUrl),
        documents: mapDocumentsFromForm(data),
        locations: data.location ? [{ id: '1', label: 'Primary', address: data.location }] : [],
      });

      setStaffList((prev) => [newStaff, ...prev]);
      return newStaff;
    },
    [staffList]
  );

  const updateStaff = useCallback((id, data) => {
    setStaffList((prev) =>
      prev.map((staff) =>
        staff.id === id
          ? {
            ...staff,
            name: data.name,
            email: data.email,
            phone: data.phoneNumber,
            gender: data.gender,
            location: data.location,
            taxNumber: data.taxNumber,
            specialities: data.specialty || ['generalNurse'],
            specialty: data.specialty?.[0] || 'generalNurse',
            ratePerHour: Number(data.ratePerHour) || 0,
            platformPercent: Number(data.platformPercent) ?? staff.platformPercent ?? 10,
            avatarUrl: resolveAvatarUrl(data.avatarUrl) || staff.avatarUrl,
            documents: {
              governmentId: data.governmentId?.length
                ? mapDocumentsFromForm(data).governmentId
                : staff.documents.governmentId,
              nursingDegree: data.nursingDegree?.length
                ? mapDocumentsFromForm(data).nursingDegree
                : staff.documents.nursingDegree,
              certifications: data.certifications?.length
                ? mapDocumentsFromForm(data).certifications
                : staff.documents.certifications,
            },
            locations: data.location
              ? staff.locations?.length
                ? staff.locations.map((loc, index) =>
                  index === 0 ? { ...loc, address: data.location } : loc
                )
                : [{ id: '1', label: 'Primary', address: data.location }]
              : staff.locations,
          }
          : staff
      )
    );
  }, []);

  const deleteStaff = useCallback((id) => {
    setStaffList((prev) => prev.filter((staff) => staff.id !== id));
  }, []);

  const toggleStaffStatus = useCallback((id) => {
    setStaffList((prev) =>
      prev.map((staff) =>
        staff.id === id
          ? { ...staff, status: staff.status === 'active' ? 'inactive' : 'active' }
          : staff
      )
    );
  }, []);

  const toggleStaffFavorite = useCallback((id) => {
    setStaffList((prev) =>
      prev.map((staff) =>
        staff.id === id ? { ...staff, isFavorite: !staff.isFavorite } : staff
      )
    );
  }, []);

  const updateStaffSelectedLocation = useCallback((id, locationId) => {
    setStaffList((prev) =>
      prev.map((staff) =>
        staff.id === id ? { ...staff, selectedLocationId: locationId } : staff
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      staffList,
      getStaffById,
      addStaff,
      updateStaff,
      deleteStaff,
      toggleStaffStatus,
      toggleStaffFavorite,
      updateStaffSelectedLocation,
    }),
    [
      staffList,
      getStaffById,
      addStaff,
      updateStaff,
      deleteStaff,
      toggleStaffStatus,
      toggleStaffFavorite,
      updateStaffSelectedLocation,
    ]
  );

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}


export function useStaff() {
  const context = useContext(StaffContext);

  if (!context) {
    throw new Error('useStaff must be used within StaffProvider');
  }

  return context;
}
