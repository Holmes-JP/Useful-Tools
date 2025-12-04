/**
 * Custom FFmpeg worker wrapper that handles blob URLs correctly.
 * This worker is instantiated as a module worker and can dynamic import blob URLs.
 */

// FFmpeg message types
const FFMessageType = {
  LOAD: 'LOAD',
  EXEC: 'EXEC',
  WRITE_FILE: 'WRITE_FILE',
  READ_FILE: 'READ_FILE',
  DELETE_FILE: 'DELETE_FILE',
  RENAME: 'RENAME',
  CREATE_DIR: 'CREATE_DIR',
  LIST_DIR: 'LIST_DIR',
  DELETE_DIR: 'DELETE_DIR',
  ERROR: 'ERROR',
  LOG: 'LOG',
  PROGRESS: 'PROGRESS',
} as const;

let ffmpeg: any;

const load = async ({ 
  coreURL, 
  wasmURL, 
  workerURL 
}: { 
  coreURL?: string; 
  wasmURL?: string; 
  workerURL?: string; 
}) => {
  const first = !ffmpeg;
  
  try {
    console.log('[worker] Loading FFmpeg core from:', coreURL);
    
    // Since this is a module worker, we can use dynamic import with blob URLs
    const coreModule = await import(/* @vite-ignore */ coreURL!);
    (self as any).createFFmpegCore = coreModule.default || coreModule.createFFmpegCore;
    
    if (!(self as any).createFFmpegCore) {
      throw new Error('createFFmpegCore not found in core module');
    }
    
    console.log('[worker] Core module loaded, initializing FFmpeg...');
    
    // Initialize FFmpeg with wasm and worker URLs
    ffmpeg = await (self as any).createFFmpegCore({
      mainScriptUrlOrBlob: `${coreURL}#${btoa(JSON.stringify({ wasmURL, workerURL }))}`,
    });
    
    ffmpeg.setLogger((data: any) => 
      self.postMessage({ type: FFMessageType.LOG, data })
    );
    
    ffmpeg.setProgress((data: any) => 
      self.postMessage({ type: FFMessageType.PROGRESS, data })
    );
    
    console.log('[worker] FFmpeg initialized successfully');
  } catch (err: any) {
    console.error('[worker] Failed to load FFmpeg:', err);
    throw new Error(`Failed to import ffmpeg-core.js: ${err.message}`);
  }
  
  return first;
};

const exec = ({ args, timeout = -1 }: { args: string[]; timeout?: number }) => {
  if (!ffmpeg) throw new Error('FFmpeg not loaded');
  ffmpeg.setTimeout(timeout);
  ffmpeg.exec(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};

const writeFile = ({ path, data }: { path: string; data: any }) => {
  if (!ffmpeg) throw new Error('FFmpeg not loaded');
  ffmpeg.FS.writeFile(path, data);
  return true;
};

const readFile = ({ path, encoding }: { path: string; encoding?: string }) => {
  if (!ffmpeg) throw new Error('FFmpeg not loaded');
  return ffmpeg.FS.readFile(path, { encoding });
};

const deleteFile = ({ path }: { path: string }) => {
  if (!ffmpeg) throw new Error('FFmpeg not loaded');
  ffmpeg.FS.unlink(path);
  return true;
};

// Message handler
self.onmessage = async ({ data: { id, type, data } }: any) => {
  try {
    let result;
    
    switch (type) {
      case FFMessageType.LOAD:
        result = await load(data);
        break;
      case FFMessageType.EXEC:
        result = exec(data);
        break;
      case FFMessageType.WRITE_FILE:
        result = writeFile(data);
        break;
      case FFMessageType.READ_FILE:
        result = readFile(data);
        break;
      case FFMessageType.DELETE_FILE:
        result = deleteFile(data);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    self.postMessage({ id, type, data: result });
  } catch (error: any) {
    console.error('[worker] Error:', error);
    self.postMessage({ id, type: FFMessageType.ERROR, data: error.message || String(error) });
  }
};
