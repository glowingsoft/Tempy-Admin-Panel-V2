import { io } from 'socket.io-client';

let socket = null;
let connectKey = '';
let session = null;
let chatObjectId = '';

const bindings = [];
const replacedListeners = new Set();
const reconnectListeners = new Set();

function rebind(nextSocket) {
  bindings.forEach(({ event, handler }) => {
    nextSocket.on(event, handler);
  });
  replacedListeners.forEach((listener) => listener(nextSocket));
}

function connectionKey({ url, subjectId, token, objectId }) {
  return [url, subjectId, token, objectId || ''].join('|');
}

export function ensureAppSocket({ url, subjectId, token, objectId } = {}) {
  const normalizedUrl = String(url || '').trim();
  const normalizedSubjectId = String(subjectId || '').trim();
  const normalizedToken = String(token || '').trim();
  const normalizedObjectId = String(objectId ?? chatObjectId ?? '').trim();

  if (!normalizedUrl || !normalizedSubjectId || !normalizedToken) return null;

  session = { url: normalizedUrl, subjectId: normalizedSubjectId, token: normalizedToken };
  chatObjectId = normalizedObjectId;

  const key = connectionKey({
    url: normalizedUrl,
    subjectId: normalizedSubjectId,
    token: normalizedToken,
    objectId: normalizedObjectId,
  });

  if (socket && connectKey === key) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.io?.removeAllListeners?.();
    socket.disconnect();
    socket = null;
  }

  const query = {
    subjectId: normalizedSubjectId,
    token: normalizedToken,
  };
  if (normalizedObjectId) query.objectId = normalizedObjectId;

  socket = io(normalizedUrl, {
    transports: ['websocket', 'polling'],
    auth: { token: normalizedToken },
    query,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  connectKey = key;
  socket.io.on('reconnect', () => {
    reconnectListeners.forEach((listener) => listener());
  });
  rebind(socket);
  return socket;
}

export function setAppSocketObjectId(objectId) {
  chatObjectId = String(objectId || '').trim();
  if (!session) return getAppSocket();
  return ensureAppSocket({ ...session, objectId: chatObjectId });
}

export function getAppSocket() {
  return socket;
}

export function onAppSocket(event, handler) {
  if (!event || typeof handler !== 'function') return () => {};

  const binding = { event, handler };
  bindings.push(binding);
  socket?.on(event, handler);

  return () => {
    const index = bindings.indexOf(binding);
    if (index >= 0) bindings.splice(index, 1);
    socket?.off(event, handler);
  };
}

export function onAppSocketReconnect(listener) {
  if (typeof listener !== 'function') return () => {};
  reconnectListeners.add(listener);
  return () => reconnectListeners.delete(listener);
}

export function onAppSocketReplaced(listener) {
  replacedListeners.add(listener);
  return () => replacedListeners.delete(listener);
}

export function disconnectAppSocket() {
  chatObjectId = '';
  session = null;
  connectKey = '';
  if (!socket) return;
  socket.removeAllListeners();
  socket.io?.removeAllListeners?.();
  socket.disconnect();
  socket = null;
}
