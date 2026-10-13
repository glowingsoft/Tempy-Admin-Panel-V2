import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { readPersistedAuthToken } from 'src/auth/utils/auth-token-storage';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';

import { disconnectAppSocket, ensureAppSocket, onAppSocket, onAppSocketReconnect } from './app-socket';
import { queueModelRefetch, readDataChanges, refetchMainLists } from './refetch-for-model';
import { resolveSocketUrl } from './socket-url';

function resolveSubjectId(user, impersonation) {
  if (impersonation?.isActive && impersonation?.targetId) {
    return String(impersonation.targetId).trim();
  }
  return String(getProfileUserId(user) || '').trim();
}


export function useAppRealtime() {
  const { user } = useSelector((state) => state.user);
  const impersonation = useSelector((state) => state.impersonation);

  const subjectId = resolveSubjectId(user, impersonation);
  const token =
    user?.token ||
    readPersistedAuthToken() ||
    (impersonation?.isActive ? impersonation?.adminToken : '');

  useEffect(() => {
    const normalizedSubjectId = String(subjectId || '').trim();
    const normalizedToken = String(token || '').trim();
    const url = resolveSocketUrl();

    if (!normalizedSubjectId || !normalizedToken || !url) {
      disconnectAppSocket();
      return undefined;
    }

    ensureAppSocket({
      url,
      subjectId: normalizedSubjectId,
      token: normalizedToken,
    });

    const handleDataChanged = (payload) => {
      readDataChanges(payload).forEach((change) => queueModelRefetch(change?.model));
    };

    const offDataChanged = onAppSocket('dataChanged', handleDataChanged);
    const offReconnect = onAppSocketReconnect(refetchMainLists);

    return () => {
      offDataChanged();
      offReconnect();
    };
  }, [subjectId, token]);
}
