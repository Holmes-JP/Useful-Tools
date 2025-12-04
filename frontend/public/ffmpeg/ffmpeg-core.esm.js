// Placeholder shim — removed the dynamic ESM wrapper to avoid Vite import
// and worker import.meta/runtime errors. The app should use the UMD core at
// `/ffmpeg/ffmpeg-core.js` (served from `public/ffmpeg`).

export default function removedShim() {
  throw new Error('ffmpeg-core.esm.js shim removed; use /ffmpeg/ffmpeg-core.js (UMD)');
}
