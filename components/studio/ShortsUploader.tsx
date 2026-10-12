import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  UploadCloud,
  Film,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileVideo,
  Layers,
  Activity,
  HardDrive,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface ImageKitUploadSuccess {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  filePath?: string;
  fileType?: string;
  height?: number;
  width?: number;
  duration?: number;
  aspectRatio?: string;
  uploadedAt: string;
}

export interface ShortsUploaderProps {
  /** Callback invoked when the video short is uploaded to ImageKit CDN */
  onUploadSuccess?: (result: ImageKitUploadSuccess) => void;
  /** Callback for error handling */
  onUploadError?: (error: string) => void;
  /** Optional custom folder on ImageKit (default: /riseup/shorts) */
  folder?: string;
  /** Optional tags for indexing in ImageKit */
  tags?: string[];
  /** Optional max duration limit in seconds (default: 90) */
  maxDurationSeconds?: number;
  /** Optional custom class name */
  className?: string;
  /** Title or headline for the component */
  title?: string;
}

interface LocalVideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  isVertical: boolean;
  thumbnailDataUrl?: string;
}

export const ShortsUploader: React.FC<ShortsUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  folder = '/riseup/shorts',
  tags = ['riseup', 'shorts', 'builder'],
  maxDurationSeconds = 90,
  className = '',
  title = 'RiseUp CDN Shorts Ingestion',
}) => {
  // State
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localMeta, setLocalMeta] = useState<LocalVideoMetadata | null>(null);

  // Upload progress & telemetry
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('0 KB/s');
  const [bytesUploaded, setBytesUploaded] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<ImageKitUploadSuccess | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Video preview player controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const lastLoadedRef = useRef<number>(0);

  // Public ImageKit Key
  const imagekitPublicKey =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_IMAGEKIT_PUBLIC_KEY) ||
    'public_eNBCBviOx4rpHN//Ca4rJ7XoxQI=';

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Format seconds helper (00:00)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract client-side metadata and thumbnail snapshot
  const inspectVideoFile = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;
    tempVideo.muted = true;
    tempVideo.playsInline = true;

    tempVideo.onloadedmetadata = () => {
      const dur = tempVideo.duration || 0;
      const w = tempVideo.videoWidth || 1080;
      const h = tempVideo.videoHeight || 1920;
      const ratio = (w / h).toFixed(2);
      const isVertical = h >= w;

      // Seek to 0.5s or midpoint to capture a snapshot thumbnail
      tempVideo.currentTime = Math.min(0.5, dur / 2);
    };

    tempVideo.onseeked = () => {
      let thumbnailDataUrl: string | undefined = undefined;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(tempVideo.videoWidth || 540, 720);
        canvas.height = Math.min(tempVideo.videoHeight || 960, 1280);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (err) {
        // Ignore canvas CORS or taint errors
      }

      setLocalMeta({
        duration: tempVideo.duration || 0,
        width: tempVideo.videoWidth || 1080,
        height: tempVideo.videoHeight || 1920,
        aspectRatio: `${tempVideo.videoWidth}:${tempVideo.videoHeight}`,
        isVertical: (tempVideo.videoHeight || 0) >= (tempVideo.videoWidth || 0),
        thumbnailDataUrl,
      });
    };

    tempVideo.onerror = () => {
      setLocalMeta({
        duration: 0,
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        isVertical: true,
      });
    };
  }, []);

  // Handle incoming file
  const handleFileSelect = (file: File) => {
    setUploadError(null);
    setUploadResult(null);
    setProgress(0);
    setBytesUploaded(0);

    // Validate video mime type & extensions
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    const validExts = ['.mp4', '.webm', '.mov', '.mkv'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExts.some((ext) => fileName.endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExt) {
      const err = 'Invalid file format. Please upload an MP4 or WebM video short.';
      setUploadError(err);
      if (onUploadError) onUploadError(err);
      return;
    }

    // Size limit check (max 250MB for shorts)
    const MAX_SIZE = 250 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const err = `File exceeds maximum 250MB threshold (${formatBytes(file.size)}).`;
      setUploadError(err);
      if (onUploadError) onUploadError(err);
      return;
    }

    setSelectedFile(file);
    inspectVideoFile(file);
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Reset uploader
  const handleReset = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setLocalMeta(null);
    setIsUploading(false);
    setProgress(0);
    setUploadSpeed('0 KB/s');
    setUploadError(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Perform ImageKit direct client-to-CDN upload
  const startUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress(0);
    setUploadError(null);
    lastTimeRef.current = Date.now();
    lastLoadedRef.current = 0;

    try {
      // 1. Fetch authentication parameters from backend endpoint
      const authRes = await fetch('/api/imagekit/auth', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!authRes.ok) {
        const errJson = await authRes.json().catch(() => ({}));
        throw new Error(
          errJson.message || `Auth endpoint responded with HTTP ${authRes.status}`
        );
      }

      const { token, expire, signature } = await authRes.json();

      if (!token || !signature || !expire) {
        throw new Error('Incomplete signature received from ImageKit authentication endpoint.');
      }

      // 2. Prepare FormData for ImageKit CDN Upload API
      const formData = new FormData();
      formData.append('file', selectedFile);
      // Clean filename for CDN indexing
      const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      formData.append('fileName', cleanName);
      formData.append('publicKey', imagekitPublicKey);
      formData.append('signature', signature);
      formData.append('expire', String(expire));
      formData.append('token', token);
      formData.append('useUniqueFileName', 'true');
      formData.append('folder', folder);
      formData.append('tags', tags.join(','));

      // 3. Execute Direct Upload via XMLHttpRequest for real-time progress calculation
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload', true);

      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          setProgress(percent);
          setBytesUploaded(event.loaded);

          // Calculate throughput speed
          const now = Date.now();
          const timeDiff = (now - lastTimeRef.current) / 1000;
          if (timeDiff >= 0.5) {
            const bytesDiff = event.loaded - lastLoadedRef.current;
            const speed = bytesDiff / timeDiff; // bytes/sec
            setUploadSpeed(`${formatBytes(speed)}/s`);
            lastTimeRef.current = now;
            lastLoadedRef.current = event.loaded;
          }
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const responseData = JSON.parse(xhr.responseText);
            setProgress(100);

            const result: ImageKitUploadSuccess = {
              fileId: responseData.fileId,
              name: responseData.name,
              url: responseData.url,
              thumbnailUrl:
                responseData.thumbnailUrl ||
                localMeta?.thumbnailDataUrl ||
                `${responseData.url}/ik-thumbnail.jpg`,
              size: responseData.size || selectedFile.size,
              filePath: responseData.filePath,
              fileType: responseData.fileType || 'video',
              height: responseData.height || localMeta?.height,
              width: responseData.width || localMeta?.width,
              duration: localMeta?.duration,
              aspectRatio: localMeta?.aspectRatio,
              uploadedAt: new Date().toISOString(),
            };

            setUploadResult(result);
            if (onUploadSuccess) {
              onUploadSuccess(result);
            }
          } catch (err: any) {
            const msg = 'Failed to parse ImageKit CDN upload response';
            setUploadError(msg);
            if (onUploadError) onUploadError(msg);
          }
        } else {
          try {
            const errResponse = JSON.parse(xhr.responseText);
            const msg =
              errResponse.message ||
              errResponse.help ||
              `Upload rejected with status ${xhr.status}`;
            setUploadError(msg);
            if (onUploadError) onUploadError(msg);
          } catch {
            const msg = `Upload failed with status ${xhr.status}: ${xhr.statusText}`;
            setUploadError(msg);
            if (onUploadError) onUploadError(msg);
          }
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        const msg = 'Network error during direct ImageKit CDN upload. Please check connectivity.';
        setUploadError(msg);
        if (onUploadError) onUploadError(msg);
      };

      xhr.onabort = () => {
        setIsUploading(false);
        setUploadError('Upload aborted by user.');
      };

      xhr.send(formData);
    } catch (err: any) {
      setIsUploading(false);
      const msg = err?.message || 'Unexpected failure initiating upload.';
      setUploadError(msg);
      if (onUploadError) onUploadError(msg);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const togglePlay = () => {
    if (!videoPreviewRef.current) return;
    if (isPlaying) {
      videoPreviewRef.current.pause();
      setIsPlaying(false);
    } else {
      videoPreviewRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoPreviewRef.current) return;
    videoPreviewRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (xhrRef.current) xhrRef.current.abort();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div
      className={`bg-neutral-950 border border-neutral-800 text-neutral-100 rounded-none shadow-2xl overflow-hidden font-sans ${className}`}
    >
      {/* Industrial Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/80 border-b border-neutral-800 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-white rounded-none animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-widest font-semibold text-neutral-200">
            {title}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-neutral-800 text-neutral-400 border border-neutral-700">
            CDN v1.0
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
          <span className="hidden sm:inline-flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-500" />
            ENDPOINT: <span className="text-neutral-200">ik.imagekit.io</span>
          </span>
          {selectedFile && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Reset uploader"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Dropzone Area (When no file is selected) */}
        {!selectedFile && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed transition-all cursor-pointer p-8 sm:p-12 flex flex-col items-center justify-center text-center ${
              dragActive
                ? 'border-white bg-neutral-900/60'
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/20 hover:bg-neutral-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-white group-hover:scale-105 transition-transform">
              <UploadCloud className="w-7 h-7 text-neutral-200" />
            </div>

            <div className="space-y-1 mb-3">
              <h4 className="text-sm font-semibold tracking-tight uppercase text-neutral-100">
                Drag & Drop Short or Click to Ingest
              </h4>
              <p className="text-xs text-neutral-400 max-w-sm">
                Direct client-to-CDN encrypted pipeline. Zero server hop.
              </p>
            </div>

            {/* Strict Industrial Telemetry Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-[10px] font-mono uppercase text-neutral-400">
                FORMAT: MP4 / WEBM
              </span>
              <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-[10px] font-mono uppercase text-neutral-400">
                ASPECT: 9:16 VERTICAL
              </span>
              <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-[10px] font-mono uppercase text-neutral-400">
                MAX: 250MB / ≤{maxDurationSeconds}S
              </span>
            </div>
          </div>
        )}

        {/* Selected File Stage & Preview */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: 9:16 Mobile Aspect Preview */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-[240px] aspect-[9/16] bg-black border border-neutral-800 overflow-hidden shadow-xl group">
                  {previewUrl && (
                    <video
                      ref={videoPreviewRef}
                      src={uploadResult?.url || previewUrl}
                      className="w-full h-full object-cover"
                      playsInline
                      muted={isMuted}
                      loop
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  )}

                  {/* Play / Mute Floating Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                    <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-[10px] font-mono text-white border border-white/10 uppercase">
                      {localMeta?.isVertical ? '9:16 SHORT' : 'STANDARD'}
                    </span>
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1.5 bg-black/70 hover:bg-black text-white border border-white/10 transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Center Play Button Overlay */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-10 h-10 bg-white text-black flex items-center justify-center shadow-lg">
                      {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
                    </div>
                  </button>

                  {/* Duration Tag */}
                  <div className="absolute bottom-2 right-2 font-mono text-[10px] bg-black/80 text-neutral-200 px-1.5 py-0.5 border border-white/10">
                    {formatTime(localMeta?.duration || 0)}
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <p className="text-[11px] font-mono text-neutral-400 truncate max-w-[240px]">
                    {selectedFile.name}
                  </p>
                </div>
              </div>

              {/* Right Column: Telemetry, Metadata & Ingestion Controller */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                {/* Data-Dense Telemetry Matrix */}
                <div className="border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 font-medium">
                      Source Telemetry
                    </span>
                    <span className="font-mono text-[11px] text-white bg-neutral-800 px-2 py-0.5 border border-neutral-700">
                      {formatBytes(selectedFile.size)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">CONTAINER</span>
                      <span className="text-neutral-200 uppercase">{selectedFile.type || 'video/mp4'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">RESOLUTION</span>
                      <span className="text-neutral-200">
                        {localMeta ? `${localMeta.width}x${localMeta.height}` : 'Extracting...'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">DURATION</span>
                      <span className="text-neutral-200">
                        {localMeta ? `${formatTime(localMeta.duration)} (${Math.round(localMeta.duration)}s)` : '--:--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">CDN TARGET</span>
                      <span className="text-neutral-200 truncate block">{folder}</span>
                    </div>
                  </div>

                  {/* Warning if duration exceeds standard shorts limit */}
                  {localMeta && localMeta.duration > maxDurationSeconds && (
                    <div className="flex items-start gap-2 p-2 bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs">
                      <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                      <span>
                        Note: Duration is {Math.round(localMeta.duration)}s. Recommended RiseUp short duration is ≤{maxDurationSeconds}s.
                      </span>
                    </div>
                  )}
                </div>

                {/* Real-time Progress Bar & Upload State */}
                {isUploading && (
                  <div className="border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-300 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-white animate-spin" />
                        DIRECT STREAMING TO IMAGEKIT CDN...
                      </span>
                      <span className="font-semibold text-white">{progress}%</span>
                    </div>

                    {/* Industrial Progress Track */}
                    <div className="w-full h-2 bg-neutral-800 border border-neutral-700 overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-150 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>{formatBytes(bytesUploaded)} / {formatBytes(selectedFile.size)}</span>
                      <span>{uploadSpeed}</span>
                    </div>
                  </div>
                )}

                {/* Success Banner & Verified ImageKit CDN URL */}
                {uploadResult && (
                  <div className="border border-neutral-700 bg-neutral-900/80 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                          Verified CDN Edge Ingestion
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-white text-black font-mono text-[10px] font-bold uppercase">
                        LIVE ON CDN
                      </span>
                    </div>

                    {/* CDN URL Input Box */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-400 block">
                        Direct ImageKit CDN URL
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={uploadResult.url}
                          className="flex-1 bg-black border border-neutral-700 text-xs font-mono text-neutral-200 px-2.5 py-1.5 focus:outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(uploadResult.url)}
                          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 font-mono text-xs flex items-center gap-1.5 transition-colors"
                        >
                          {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUrl ? 'COPIED' : 'COPY'}</span>
                        </button>
                        <a
                          href={uploadResult.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 transition-colors"
                          title="Open CDN URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Metadata breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400 pt-1">
                      <div>
                        <span className="text-neutral-500">CDN FILE ID: </span>
                        <span className="text-neutral-300 truncate">{uploadResult.fileId}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">INDEXED AT: </span>
                        <span className="text-neutral-300">{new Date(uploadResult.uploadedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {uploadError && (
                  <div className="border border-neutral-700 bg-neutral-900 p-3 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs font-mono">
                      <span className="text-white font-semibold block uppercase">Ingestion Failure</span>
                      <span className="text-neutral-300">{uploadError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadError(null)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  {!uploadResult ? (
                    <>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={startUpload}
                        className="w-full sm:flex-1 py-2.5 px-4 bg-white hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        {isUploading ? (
                          <>
                            <Activity className="w-3.5 h-3.5 animate-spin" />
                            <span>STREAMING TO CDN ({progress}%)</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>STREAM DIRECT TO IMAGEKIT CDN</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={handleReset}
                        className="w-full sm:w-auto py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-neutral-300 border border-neutral-800 font-mono text-xs uppercase transition-colors"
                      >
                        CHANGE FILE
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="w-full sm:flex-1 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>INGEST ANOTHER SHORT</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Industrial Footer Status Bar */}
      <div className="px-4 py-2 bg-neutral-900/60 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
            DIRECT CLIENT-TO-CDN ENCRYPTED
          </span>
          <span className="hidden md:inline text-neutral-600">|</span>
          <span className="hidden md:inline">NO PAID CARD DEPENDENCIES</span>
        </div>
        <div>
          <span>HMAC-SHA1 SIGNED</span>
        </div>
      </div>
    </div>
  );
};
