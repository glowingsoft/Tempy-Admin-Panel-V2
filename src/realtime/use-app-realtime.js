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

function queueFromPayload(payload) {
  const changes = readDataChanges(payload);
  if (changes.length) {
    changes.forEach((change) => {
      queueModelRefetch(
        change?.model ||
          change?.Model ||
          change?.entity ||
          change?.entityType ||
          change?.collection ||
          change
      );
    });
    return;
  }

  if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
    ['job', 'booking', 'bid', 'notification', 'staff'].forEach(queueModelRefetch);
  }
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
      queueFromPayload(payload);
    };

    const offDataChanged = onAppSocket('dataChanged', handleDataChanged);
    const offDataChangedAlt = onAppSocket('data-changed', handleDataChanged);
    const offDataUpdate = onAppSocket('dataUpdate', handleDataChanged);
    const offDataUpdated = onAppSocket('dataUpdated', handleDataChanged);

    const offReconnect = onAppSocketReconnect(refetchMainLists);

    return () => {
      offDataChanged();
      offDataChangedAlt();
      offDataUpdate();
      offDataUpdated();
      offReconnect();
    };
  }, [subjectId, token]);
}
