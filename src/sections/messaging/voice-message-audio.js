export function voicePlaybackType(url = '', mimeType = '') {
  const mime = String(mimeType || '').toLowerCase();
  if (mime.includes('webm')) return 'audio/webm';
  if (mime.includes('wav')) return 'audio/wav';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'audio/mpeg';
  if (mime.includes('ogg') || mime.includes('opus')) return 'audio/ogg';
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac') || mime.includes('caf')) {
    return 'audio/mp4';
  }

  const path = String(url || '').split('?')[0].toLowerCase();
  if (path.endsWith('.webm')) return 'audio/webm';
  if (path.endsWith('.wav')) return 'audio/wav';
  if (path.endsWith('.mp3')) return 'audio/mpeg';
  if (path.endsWith('.ogg') || path.endsWith('.opus')) return 'audio/ogg';
  if (path.endsWith('.m4a') || path.endsWith('.mp4') || path.endsWith('.aac') || path.endsWith('.caf')) {
    return 'audio/mp4';
  }
  if (mime.startsWith('audio/')) return mime;
  return '';
}

export function isVoiceMediaUrl(url = '', mimeType = '') {
  return Boolean(voicePlaybackType(url, mimeType));
}

export function preferredVoiceRecorderMime() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return '';
  const candidates = ['audio/mp4', 'audio/aac', 'audio/mp4;codecs=mp4a.40.2'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function isPhoneContainer(mimeType = '') {
  return /^audio\/(mp4|aac|m4a|x-m4a|mp4a)/i.test(String(mimeType || ''));
}

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function mixToMono(audioBuffer) {
  const { numberOfChannels, length } = audioBuffer;
  if (numberOfChannels === 1) return audioBuffer.getChannelData(0);

  const mixed = new Float32Array(length);
  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) mixed[index] += data[index] / numberOfChannels;
  }
  return mixed;
}

function resampleMono(samples, sourceRate, targetRate) {
  if (!samples.length || targetRate >= sourceRate) return { samples, sampleRate: sourceRate };

  const ratio = sourceRate / targetRate;
  const length = Math.max(1, Math.floor(samples.length / ratio));
  const output = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.min(samples.length, Math.floor((index + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let cursor = start; cursor < end; cursor += 1) {
      sum += samples[cursor];
      count += 1;
    }
    output[index] = count ? sum / count : 0;
  }
  return { samples: output, sampleRate: targetRate };
}

function encodeWav(samples, sampleRate) {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function pcmToWavBlob(channelData, sampleRate) {
  const channels = Array.isArray(channelData) ? channelData.filter(Boolean) : [];
  const length = channels[0]?.length || 0;
  const mono = new Float32Array(length);

  if (channels.length === 1) {
    mono.set(channels[0]);
  } else {
    channels.forEach((data) => {
      for (let index = 0; index < length; index += 1) mono[index] += data[index] / channels.length;
    });
  }

  return encodeWav(mono, sampleRate || 44100);
}

export function toSameOriginMediaUrl(url = '') {
  try {
    const assetBase = String(import.meta.env.VITE_ASSET_URL || '').replace(/\/$/, '');
    const parsed = new URL(url, window.location.origin);
    const assetHost = assetBase ? new URL(assetBase).host : 'tempys3-bucket.s3.eu-west-2.amazonaws.com';
    if (parsed.host !== assetHost) return url;
    return `/s3-media${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export async function loadPlayableVoiceObjectUrl(url) {
  const response = await fetch(toSameOriginMediaUrl(url));
  if (!response.ok) throw new Error('Could not load voice message');

  // Loaded from public/decode-voice.js. Vite must not bundle @audio/decode-mp4;
  // Rollup cannot parse that package and the production build fails.
  const decode = (await import(/* @vite-ignore */ `${import.meta.env.BASE_URL}decode-voice.js`)).default;
  const decoded = await decode(new Uint8Array(await response.arrayBuffer()));
  const blob = pcmToWavBlob(decoded?.channelData, decoded?.sampleRate);
  return URL.createObjectURL(blob);
}

async function blobToWav(blob) {
  const audioContext = new AudioContext();
  try {
    if (audioContext.state === 'suspended') await audioContext.resume();
    const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer());
    const mono = mixToMono(decoded);
    const { samples, sampleRate } = resampleMono(mono, decoded.sampleRate, 16000);
    return encodeWav(samples, sampleRate);
  } finally {
    await audioContext.close();
  }
}


export async function toMobilePlayableVoiceFile(blob, mimeType = '') {
  const type = String(mimeType || blob?.type || '');
  if (isPhoneContainer(type)) {
    return new File([blob], `voice-${Date.now()}.m4a`, { type: 'audio/mp4' });
  }

  const wavBlob = await blobToWav(blob);
  return new File([wavBlob], `voice-${Date.now()}.wav`, { type: 'audio/wav' });
}
