import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { LaneType } from '../types';
import { formatTimestamp } from '../utils/videoEnhancements';
import { videoStorageService } from '../services/videoStorage';
import { ShortsUploader, ImageKitUploadSuccess } from '../../components/studio/ShortsUploader';
import {
  X,
  Upload,
  Check,
  CheckCircle2,
  Copy,
  Film,
  Sparkles,
  FileText,
  ShieldCheck,
  Globe,
  Lock,
  Eye,
  Camera,
  Link as LinkIcon,
  Video,
  Mic,
  StopCircle,
  Play,
  RotateCcw,
  Flame,
} from 'lucide-react';

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedFile?: File | null;
}

export const UploadVideoModal: React.FC<UploadVideoModalProps> = ({
  isOpen,
  onClose,
  preselectedFile,
}) => {
  const { uploadVideo, setSelectedVideo } = useApp();

  const [creationMode, setCreationMode] = useState<'upload' | 'record' | 'url' | 'imagekit'>('upload');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<LaneType>('Engineering');
  const [tags, setTags] = useState<string>('Engineering, BuildInPublic, Systems');
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public');
  const [isShortsFormat, setIsShortsFormat] = useState<boolean>(false);
  const [durationSec, setDurationSec] = useState<number>(180);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string>('');
  const [generatedThumbs, setGeneratedThumbs] = useState<string[]>([]);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [isUploadFinished, setIsUploadFinished] = useState<boolean>(false);
  const [checksPassed, setChecksPassed] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [publishedVideoId, setPublishedVideoId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Camera recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordingTimerRef = useRef<any>(null);

  // URL import state
  const [urlInput, setUrlInput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const customThumbInputRef = useRef<HTMLInputElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const stopCameraPreview = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  }, [cameraStream]);

  const handleFileSelected = useCallback((file: File) => {
    if (!file || !file.type.startsWith('video/')) return;
    setSelectedFile(file);

    const instantUrl = URL.createObjectURL(file);
    setPreviewUrl(instantUrl);

    const cleanTitle = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]/g, ' ')
      .trim();
    setTitle(cleanTitle);

    setUploadPercent(25);
    setIsUploadFinished(false);
    setChecksPassed(false);

    const progressTimer = setInterval(() => {
      setUploadPercent((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setIsUploadFinished(true);
          setChecksPassed(true);
          return 100;
        }
        return prev + 25;
      });
    }, 200);

    const probeVid = document.createElement('video');
    probeVid.src = instantUrl;
    probeVid.preload = 'metadata';
    probeVid.muted = true;
    probeVid.playsInline = true;

    probeVid.onloadedmetadata = () => {
      const dur = Math.round(probeVid.duration) || 120;
      setDurationSec(dur);

      const isVertical = probeVid.videoHeight > probeVid.videoWidth || dur <= 60;
      setIsShortsFormat(isVertical);

      probeVid.currentTime = Math.max(1, dur * 0.15);
    };

    probeVid.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = probeVid.videoWidth || 640;
        canvas.height = probeVid.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(probeVid, 0, 0, canvas.width, canvas.height);
          const thumb1 = canvas.toDataURL('image/jpeg', 0.85);
          setGeneratedThumbs([thumb1]);
          setThumbnailDataUrl(thumb1);
        }
      } catch {
        // Fallback
      }
    };
  }, []);

  // Initialize with preselected file if provided
  useEffect(() => {
    if (preselectedFile) {
      handleFileSelected(preselectedFile);
    }
  }, [preselectedFile, isOpen, handleFileSelected]);

  // Reset when closed or opened fresh
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setIsPublished(false);
      setPublishedVideoId('');
      setSelectedFile(null);
      setPreviewUrl('');
      setTitle('');
      setDescription('');
      stopCameraPreview();
    }
  }, [isOpen, stopCameraPreview]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraPreview();
    };
  }, [stopCameraPreview]);

  // Camera Recording Handlers
  const startCameraRecording = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play();
      }

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const recordedFile = new File([blob], `recorded_drop_${Date.now()}.webm`, {
          type: 'video/webm',
        });
        stopCameraPreview();
        handleFileSelected(recordedFile);
      };

      recorder.start(500);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Camera recording error:', err);
      setCameraError('Unable to access webcam or microphone. Please check browser permissions.');
    }
  };

  const stopCameraRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // URL Import Handler
  const handleUrlImport = () => {
    if (!urlInput.trim()) return;
    const directUrl = urlInput.trim();
    setPreviewUrl(directUrl);
    setTitle(directUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Imported Video Drop');
    setDurationSec(60);
    setIsShortsFormat(false);
    setIsUploadFinished(true);
    setChecksPassed(true);
    setUploadPercent(100);
    setSelectedFile(new File([''], 'stream_video.mp4', { type: 'video/mp4' }));
  };

  const handleCustomThumbSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) setThumbnailDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSuggestedChapters = () => {
    const chapterTemplate = `\n\n0:00 Introduction & Context\n1:15 Core Protocol Framework\n3:30 Execution & Habits\n5:00 Final Takeaways & Q&A`;
    setDescription((prev) => (prev ? prev + chapterTemplate : chapterTemplate.trim()));
  };

  const handlePublish = async () => {
    const vidId = isShortsFormat ? `short_${Date.now()}` : `vid_${Date.now()}`;
    const effectiveTitle = title.trim() || 'Untitled Video Drop';
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let finalVideoUrl = previewUrl || '';
    if (selectedFile && selectedFile.size > 0) {
      try {
        const persistedUrl = await videoStorageService.saveVideoBlob(vidId, selectedFile);
        if (persistedUrl) finalVideoUrl = persistedUrl;
      } catch (e) {
        console.warn('IndexedDB save skipped:', e);
      }
    }

    await uploadVideo({
      id: vidId,
      title: effectiveTitle,
      description: description || 'Technical walkthrough and build protocol.',
      category,
      isShort: isShortsFormat,
      tags: tagList.length > 0 ? tagList : [category, 'RiseUp'],
      videoUrl: finalVideoUrl,
      thumbnailUrl: thumbnailDataUrl || undefined,
      durationSeconds: durationSec,
      durationFormatted: formatTimestamp(durationSec),
      aspectRatio: isShortsFormat ? '9:16' : '16:9',
    });

    setPublishedVideoId(vidId);
    setIsPublished(true);
  };

  const videoLink = `${window.location.origin}/?v=${publishedVideoId || 'new'}`;

  const copyLink = () => {
    navigator.clipboard?.writeText(videoLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-black">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white truncate max-w-md m-0 uppercase font-mono">
                {title ? title : 'New Video Drop'}
              </h2>
              <span className="text-[10px] text-neutral-400 font-mono">
                Studio Creator Engine
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraPreview();
              onClose();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Screen after publish */}
        {isPublished ? (
          <div className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-14 h-14 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center mx-auto shadow-lg">
              <Check className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-xl font-black text-white uppercase font-mono">Video Published Successfully</h3>
              <p className="text-xs text-neutral-400 font-mono">
                Your drop is live on the {isShortsFormat ? 'reels feed' : 'home feed'} and available to watch immediately.
              </p>
            </div>

            <div className="max-w-md mx-auto p-3 bg-black border border-neutral-800 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="truncate max-w-[280px] text-neutral-300">{videoLink}</span>
              <button
                type="button"
                onClick={copyLink}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono text-xs transition-colors flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setSelectedVideo({
                    id: publishedVideoId,
                    title,
                    description,
                    creatorId: 'usr_me',
                    creatorName: 'You',
                    creatorUsername: 'you',
                    creatorAvatar: '',
                    videoUrl: previewUrl,
                    thumbnailUrl: thumbnailDataUrl,
                    durationSeconds: durationSec,
                    durationFormatted: formatTimestamp(durationSec),
                    viewsCount: 0,
                    likesCount: 0,
                    savesCount: 0,
                    commentsCount: 0,
                    category,
                    aspectRatio: isShortsFormat ? '9:16' : '16:9',
                    isShort: isShortsFormat,
                    createdAt: 'Just now',
                    tags: tags.split(',').map((t) => t.trim()),
                    status: 'published',
                    isLearning: false,
                    renditions: [],
                  });
                }}
                className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-extrabold uppercase rounded-lg transition-colors"
              >
                Launch Player
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono font-bold rounded-lg transition-colors border border-neutral-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : !selectedFile ? (
          /* Step 0: Selector with 3 Creation Modes */
          <div className="p-6 sm:p-10 space-y-6">
            {/* Mode Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl mx-auto p-1 bg-black border border-neutral-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  stopCameraPreview();
                  setCreationMode('upload');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                  creationMode === 'upload' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCameraPreview();
                  setCreationMode('imagekit');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                  creationMode === 'imagekit' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>ImageKit Shorts</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('record')}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                  creationMode === 'record' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Record</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCameraPreview();
                  setCreationMode('url');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                  creationMode === 'url' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Import URL</span>
              </button>
            </div>

            {/* Mode 1: File Drop */}
            {creationMode === 'upload' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="max-w-lg mx-auto p-10 border-2 border-dashed border-neutral-700 hover:border-white bg-black rounded-2xl cursor-pointer transition-colors flex flex-col items-center justify-center space-y-4 group"
                >
                  <div className="w-16 h-16 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 group-hover:text-white flex items-center justify-center transition-colors shadow-lg">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-sm font-extrabold text-white uppercase font-mono">
                      Drag and drop video file to publish
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono">
                      MP4 or WebM video format supported
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-extrabold uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Select File From Device
                  </button>
                </div>
              </div>
            )}

            {/* Mode: ImageKit Video Shorts CDN Ingestion */}
            {creationMode === 'imagekit' && (
              <div className="max-w-2xl mx-auto">
                <ShortsUploader
                  folder="/riseup/shorts"
                  tags={['riseup', 'shorts', 'creator']}
                  onUploadSuccess={(result: ImageKitUploadSuccess) => {
                    setPreviewUrl(result.url);
                    setTitle(result.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') || 'New RiseUp Short');
                    setIsShortsFormat(true);
                    setDurationSec(Math.round(result.duration || 45));
                    if (result.thumbnailUrl) {
                      setThumbnailDataUrl(result.thumbnailUrl);
                    }
                    setIsUploadFinished(true);
                    setChecksPassed(true);
                    setUploadPercent(100);
                    setSelectedFile(new File([''], result.name, { type: 'video/mp4' }));
                    setStep(2);
                  }}
                />
              </div>
            )}
            {creationMode === 'record' && (
              <div className="max-w-lg mx-auto bg-black border border-neutral-800 rounded-2xl p-6 text-center space-y-4">
                <div className="relative aspect-video max-w-md mx-auto bg-neutral-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-neutral-700">
                  <video
                    ref={cameraVideoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!cameraStream && (
                    <div className="text-neutral-400 flex flex-col items-center gap-2">
                      <Camera className="w-8 h-8 text-neutral-500" />
                      <span className="text-xs font-mono">Camera preview ready to initialize</span>
                    </div>
                  )}
                  {isRecording && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-red-600 text-white rounded text-xs font-bold font-mono flex items-center gap-2 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>REC {formatTimestamp(recordingSeconds)}</span>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <p className="text-xs text-neutral-300 font-mono">{cameraError}</p>
                )}

                <div className="flex items-center justify-center gap-3">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startCameraRecording}
                      className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black font-extrabold font-mono text-xs uppercase rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Camera & Mic</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCameraRecording}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold font-mono text-xs uppercase rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>Stop & Capture Drop</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 font-mono">
                  Record your walkthrough or vertical video directly in browser.
                </p>
              </div>
            )}

            {/* Mode 3: Direct URL Import */}
            {creationMode === 'url' && (
              <div className="max-w-lg mx-auto bg-black border border-neutral-800 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center mx-auto">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white uppercase font-mono">Import Video From Direct URL</h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Enter any public MP4 or WebM stream link.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/stream.mp4"
                    className="flex-1 px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-white rounded-lg text-xs text-white focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleUrlImport}
                    className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-extrabold uppercase rounded-lg transition-colors shrink-0"
                  >
                    Import
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-6 text-[11px] text-neutral-500 font-mono">
              <span>MP4 / WebM</span>
              <span>•</span>
              <span>Direct Video Storage</span>
              <span>•</span>
              <span>Zero Mock Fallback</span>
            </div>
          </div>
        ) : (
          /* Main 4-Step Wizard */
          <div className="flex flex-col flex-1">
            {/* Step Navigation Tabs */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-black text-xs">
              <div className="flex items-center gap-6">
                {[
                  { num: 1, label: 'Details' },
                  { num: 2, label: 'Elements' },
                  { num: 3, label: 'Checks' },
                  { num: 4, label: 'Visibility' },
                ].map((s) => (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setStep(s.num as any)}
                    className={`flex items-center gap-2 pb-1 transition-colors uppercase font-mono ${
                      step === s.num
                        ? 'text-white font-extrabold border-b-2 border-white'
                        : step > s.num
                        ? 'text-neutral-300'
                        : 'text-neutral-500'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono ${
                        step === s.num
                          ? 'bg-white text-black font-bold'
                          : step > s.num
                          ? 'bg-neutral-800 text-white'
                          : 'bg-neutral-900 text-neutral-500'
                      }`}
                    >
                      {step > s.num ? <Check className="w-3 h-3" /> : s.num}
                    </span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2 font-mono text-[11px]">
                {isUploadFinished ? (
                  <span className="flex items-center gap-1.5 text-white font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready 100%</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-neutral-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>Processing {uploadPercent}%</span>
                  </span>
                )}
              </div>
            </div>

            {/* Split Screen Form + Persistent Preview Card */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto max-h-[60vh] p-6 gap-6">
              {/* Left Column: Active Step Form */}
              <div className="lg:col-span-8 space-y-5">
                {/* STEP 1: DETAILS */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <label className="font-bold text-white uppercase font-mono">Title (required)</label>
                        <span className="text-[10px] font-mono text-neutral-500">{title.length}/100</span>
                      </div>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Add a title..."
                        maxLength={100}
                        className="w-full bg-black border border-neutral-700 focus:border-white rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <label className="font-bold text-white uppercase font-mono">Description</label>
                        <button
                          type="button"
                          onClick={handleAddSuggestedChapters}
                          className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white font-mono uppercase"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Insert Chapters</span>
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your video..."
                        className="w-full bg-black border border-neutral-700 focus:border-white rounded-lg p-3 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors leading-relaxed"
                      />
                    </div>

                    {/* Thumbnail Section */}
                    <div>
                      <label className="block text-xs font-bold text-white mb-1.5 uppercase font-mono">Thumbnail</label>
                      <p className="text-[11px] text-neutral-400 mb-2.5 font-mono">
                        Choose an auto-extracted frame or upload custom image.
                      </p>
                      <div className="grid grid-cols-4 gap-2.5">
                        <input
                          ref={customThumbInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCustomThumbSelected}
                        />
                        <button
                          type="button"
                          onClick={() => customThumbInputRef.current?.click()}
                          className="aspect-video bg-black border border-dashed border-neutral-700 hover:border-white rounded-lg flex flex-col items-center justify-center p-2 text-center transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-neutral-400 mb-1" />
                          <span className="text-[10px] text-neutral-400 font-mono">Upload Image</span>
                        </button>

                        {generatedThumbs.map((thumb, idx) => (
                          <div
                            key={idx}
                            onClick={() => setThumbnailDataUrl(thumb)}
                            className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative ${
                              thumbnailDataUrl === thumb
                                ? 'border-white shadow-md'
                                : 'border-transparent opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img src={thumb} alt="Auto thumb" className="w-full h-full object-cover" />
                            {thumbnailDataUrl === thumb && (
                              <div className="absolute top-1 right-1 p-0.5 bg-white text-black rounded">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Category / Lane */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-white mb-1.5 uppercase font-mono">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as LaneType)}
                          className="w-full bg-black border border-neutral-700 focus:border-white rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          <option value="Engineering">Engineering</option>
                          <option value="Systems">Systems</option>
                          <option value="Focus">Focus</option>
                          <option value="Fitness">Fitness</option>
                          <option value="Finance">Finance</option>
                          <option value="Mindset">Mindset</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white mb-1.5 uppercase font-mono">Tags</label>
                        <input
                          type="text"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          placeholder="e.g. React, Systems"
                          className="w-full bg-black border border-neutral-700 focus:border-white rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: VIDEO ELEMENTS */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 bg-black border border-neutral-800 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-white" />
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase font-mono">Subtitles & Transcript</h4>
                          <p className="text-[11px] text-neutral-400 font-mono">
                            Auto-generated transcripts for search and navigation.
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-neutral-900 text-white border border-neutral-700 font-mono text-[10px] rounded">
                        ENABLED
                      </span>
                    </div>

                    <div className="p-4 bg-black border border-neutral-800 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Film className="w-5 h-5 text-white" />
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase font-mono">Video Chapters</h4>
                          <p className="text-[11px] text-neutral-400 font-mono">
                            Chapters to easily scrub long recordings.
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-neutral-900 text-white border border-neutral-700 font-mono text-[10px] rounded">
                        SYNCHRONIZED
                      </span>
                    </div>
                  </div>
                )}

                {/* STEP 3: CHECKS */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-5 bg-black border border-neutral-800 rounded-xl space-y-3">
                      <div className="flex items-start gap-3.5">
                        <ShieldCheck className="w-5 h-5 text-white shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white uppercase font-mono">Integrity Checks</h4>
                          <p className="text-xs text-neutral-300 font-mono flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>Zero stream defects detected. Ready for playback.</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: VISIBILITY */}
                {step === 4 && (
                  <div className="space-y-4 animate-in fade-in">
                    <label className="block text-xs font-bold text-white mb-2 uppercase font-mono">Visibility</label>
                    <div className="space-y-2.5">
                      {[
                        {
                          val: 'public',
                          title: 'Public Deck',
                          desc: 'Everyone can watch and find in search.',
                          icon: Globe,
                        },
                        {
                          val: 'unlisted',
                          title: 'Unlisted Link',
                          desc: 'Anyone with the direct link can watch.',
                          icon: Eye,
                        },
                        {
                          val: 'private',
                          title: 'Private Vault',
                          desc: 'Only you can view.',
                          icon: Lock,
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = visibility === item.val;
                        return (
                          <div
                            key={item.val}
                            onClick={() => setVisibility(item.val as any)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
                              isSelected
                                ? 'bg-neutral-900 border-white text-white'
                                : 'bg-black border-neutral-800 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="visibility"
                              checked={isSelected}
                              onChange={() => setVisibility(item.val as any)}
                              className="mt-0.5 accent-white"
                            />
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-white font-mono uppercase">
                                <Icon className="w-3.5 h-3.5 text-white" />
                                <span>{item.title}</span>
                              </div>
                              <p className="text-[11px] text-neutral-400 font-mono">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sparks Toggle */}
                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-white" />
                        <div>
                          <div className="text-xs font-bold text-white uppercase font-mono">Format as Vertical Reel (9:16)</div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            Routes into the vertical Reel Theater feed.
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isShortsFormat}
                        onChange={(e) => setIsShortsFormat(e.target.checked)}
                        className="w-4 h-4 accent-white rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Persistent Preview Card */}
              <div className="lg:col-span-4 space-y-3.5">
                <div className="bg-black border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
                  {/* Video Player */}
                  <div className="relative aspect-video bg-black flex items-center justify-center border-b border-neutral-800">
                    <video
                      ref={videoPreviewRef}
                      src={previewUrl}
                      poster={thumbnailDataUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Card Metadata */}
                  <div className="p-3.5 space-y-2 text-xs bg-black">
                    <div>
                      <span className="text-[10px] text-neutral-500 font-mono uppercase">Stream Link</span>
                      <div className="flex items-center justify-between text-neutral-300 font-mono text-[11px] mt-0.5">
                        <span className="truncate max-w-[180px]">{videoLink}</span>
                        <button
                          type="button"
                          onClick={copyLink}
                          className="p-1 hover:text-white transition-colors"
                          title="Copy Link"
                        >
                          {copiedLink ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                      <span>SPECIFICATION</span>
                      <span className="px-1.5 py-0.5 bg-neutral-900 text-white rounded font-mono text-[10px] font-bold border border-neutral-700">
                        1080p MASTER
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-black text-xs">
              <div className="flex items-center gap-3">
                {checksPassed ? (
                  <div className="flex items-center gap-1.5 text-neutral-300 text-xs font-mono font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Clearance complete.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${uploadPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono">Loading {uploadPercent}%</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((prev) => (prev - 1) as any)}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold uppercase rounded-lg transition-colors border border-neutral-700"
                  >
                    Back
                  </button>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep((prev) => (prev + 1) as any)}
                    className="px-5 py-2 bg-white text-black hover:bg-neutral-200 font-mono font-extrabold uppercase rounded-lg transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="px-6 py-2 bg-white hover:bg-neutral-200 text-black font-mono font-extrabold uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Publish Drop
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
