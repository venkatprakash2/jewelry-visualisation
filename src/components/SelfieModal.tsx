import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, SwitchCamera } from 'lucide-react';
import { CustomerPhoto, BodyPartTarget } from '../types';

interface SelfieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureSelfie: (photo: CustomerPhoto) => void;
  initialType?: BodyPartTarget;
}

export const SelfieModal: React.FC<SelfieModalProps> = ({
  isOpen,
  onClose,
  onCaptureSelfie,
  initialType = 'face',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [selfieType, setSelfieType] = useState<BodyPartTarget>(initialType);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    setSelfieType(initialType);
  }, [initialType]);

  const startCamera = async (mode: 'user' | 'environment') => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1080 },
          height: { ideal: 1440 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Please allow camera permissions in your browser to click a selfie.');
    }
  };

  useEffect(() => {
    if (isOpen && !capturedDataUrl) {
      startCamera(facingMode);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedDataUrl(dataUrl);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (!capturedDataUrl) return;
    const newPhoto: CustomerPhoto = {
      id: `selfie-${Date.now()}`,
      name: selfieType === 'face' ? 'Face Selfie' : 'Hand Selfie',
      url: capturedDataUrl,
      targetCategory: selfieType,
      aspectRatio: '3:4',
      isSample: false,
    };
    onCaptureSelfie(newPhoto);
    onClose();
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCapturedDataUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#190609] border border-[#D4AF37]/50 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header with 2 Selfie Mode Tabs */}
        <div className="bg-[#3D080F] p-3 border-b border-[#540813] flex items-center justify-between">
          <div className="flex bg-[#160407] rounded-xl p-0.5 border border-[#540813]">
            <button
              type="button"
              onClick={() => setSelfieType('face')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selfieType === 'face'
                  ? 'bg-[#D4AF37] text-[#3D040C]'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Face Selfie
            </button>
            <button
              type="button"
              onClick={() => setSelfieType('hand')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selfieType === 'hand'
                  ? 'bg-[#D4AF37] text-[#3D040C]'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Hand Selfie
            </button>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative bg-black aspect-[3/4] w-full flex items-center justify-center overflow-hidden">
          {capturedDataUrl ? (
            <img
              src={capturedDataUrl}
              alt="Selfie"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Contextual alignment guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {selfieType === 'face' ? (
                  <div className="w-52 h-72 border-2 border-dashed border-[#F5D061]/80 rounded-[50%] flex flex-col items-center justify-between py-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                    <span className="bg-black/60 text-[#F5D061] text-[9px] px-2 py-0.5 rounded-full">
                      Hairline / Tikka
                    </span>
                    <span className="bg-black/60 text-[#F5D061] text-[9px] px-2 py-0.5 rounded-full">
                      Ear &amp; Neckline
                    </span>
                  </div>
                ) : (
                  <div className="w-52 h-64 border-2 border-dashed border-[#F5D061]/80 rounded-2xl flex flex-col items-center justify-between py-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                    <span className="bg-black/60 text-[#F5D061] text-[9px] px-2 py-0.5 rounded-full">
                      Fingers &amp; Ring
                    </span>
                    <span className="bg-black/60 text-[#F5D061] text-[9px] px-2 py-0.5 rounded-full">
                      Wrist &amp; Bangles
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {cameraError && (
            <div className="absolute inset-x-4 top-4 bg-red-950/90 text-red-200 border border-red-800 p-3 rounded-xl text-xs text-center">
              {cameraError}
            </div>
          )}
        </div>

        {/* Shutter / Actions */}
        <div className="bg-[#24080D] p-3 border-t border-[#540813] flex items-center justify-between">
          {capturedDataUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#150508] border border-[#540813] text-stone-300 text-xs font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F5D061] text-[#3D040C] text-xs font-bold shadow-md"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Use Selfie</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  const next = facingMode === 'user' ? 'environment' : 'user';
                  setFacingMode(next);
                  startCamera(next);
                }}
                className="p-2 rounded-xl bg-[#150508] text-stone-300 border border-[#540813]"
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCapture}
                className="w-12 h-12 rounded-full bg-white border-3 border-[#D4AF37] p-0.5 flex items-center justify-center shadow-lg active:scale-95"
                title="Snap"
              >
                <div className="w-full h-full rounded-full bg-[#6B0E1D] flex items-center justify-center">
                  <Camera className="w-5 h-5 text-[#F5D061]" />
                </div>
              </button>

              <div className="w-8" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
