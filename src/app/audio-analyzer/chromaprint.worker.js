// This file will be loaded as a Web Worker for chromaprint.js
importScripts('https://cdn.jsdelivr.net/npm/@acoustid/chromaprint-js@1.4.3/dist/chromaprint.js');

self.onmessage = async function(e) {
  const { audioBuffer } = e.data;
  try {
    const fp = await Chromaprint.fingerprint(audioBuffer, 44100);
    self.postMessage({ fingerprint: fp.fingerprint, duration: fp.duration });
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
