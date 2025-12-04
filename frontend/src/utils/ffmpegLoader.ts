/**
 * FFmpeg loader utility with custom worker wrapper.
 * Provides a worker URL that bypasses Vite's worker bundling.
 */

export interface FFmpegLoadConfig {
  classWorkerURL?: string;
  coreURL: string;
  wasmURL: string;
  workerURL?: string;
}

/**
 * Get FFmpeg load configuration with custom worker.
 * 
 * @returns Load config that bypasses Vite transform issues
 */
export function getFFmpegConfig(): FFmpegLoadConfig {
  // Use the official @ffmpeg/core ESM build from unpkg CDN to avoid Vite
  // transforming files in /public. This URL is ESM-compatible and will be
  // fetched by the worker via dynamic import.
  const CORE_VERSION = '0.12.9';
  const base = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;
  return {
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    workerURL: `${base}/ffmpeg-core.worker.js`,
  };
}
