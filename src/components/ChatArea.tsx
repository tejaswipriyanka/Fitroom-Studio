import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ImagePlus,
  LayoutTemplate,
  Loader2,
  Mic,
  Phone,
  PhoneOff,
  Send,
  Shirt,
  SlidersHorizontal,
  Square,
  X,
} from 'lucide-react';
import {
  FORMALITY_OPTIONS,
  OCCASIONS,
  WEATHER_OPTIONS,
} from '../data/experts';
import {
  ChatMessage,
  ClosetItem,
  ExpertStylist,
  FitroomSettings,
  FormalityLevel,
  GuestProfile,
  WeatherCondition,
} from '../types';
import {
  decodePcm24kToAudioBuffer,
  encodeWavBase64,
  float32ToInt16PcmBase64,
  resampleTo16k,
} from '../utils/audioUtils';

interface ChatAreaProps {
  activeExpert: ExpertStylist;
  settings: FitroomSettings;
  onUpdateSettings: (settings: FitroomSettings) => void;
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    occasion: string,
    imageBase64?: string,
    audioBase64?: string,
    weather?: WeatherCondition,
    formality?: FormalityLevel,
    closetOnly?: boolean
  ) => void;
  isSending: boolean;
  selectedOccasion: string;
  onSelectOccasion: (occ: string) => void;
  closetItems: ClosetItem[];
  guestProfile: GuestProfile;
  weatherCondition: WeatherCondition;
  onSelectWeather: (weather: WeatherCondition) => void;
  formalityLevel: FormalityLevel;
  onSelectFormality: (level: FormalityLevel) => void;
  useClosetOnly: boolean;
  onToggleUseClosetOnly: (val: boolean) => void;
  onGenerateOutfitPhoto: (messageId: string, customOutfitName?: string) => void;
  onOpenProfile?: () => void;
  onSkipProfilePrompt?: () => void;
}

function renderFormattedLine(line: string, key: number) {
  const trimmed = line.trim();
  if (!trimmed) return <div key={key} className="h-2" />;

  const renderInline = (text: string) => {
    const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return tokens.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-stone-950 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="italic text-stone-700 dark:text-stone-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
    const cleanHeading = trimmed.replace(/^#{2,3}\s+/, '');
    return (
      <h4 key={key} className="text-sm font-semibold text-stone-950 dark:text-white pt-1">
        {renderInline(cleanHeading)}
      </h4>
    );
  }

  if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    const cleanBullet = trimmed.replace(/^[•\-*]\s+/, '');
    return (
      <div key={key} className="flex items-start gap-2 pl-1">
        <span className="text-blue-700 dark:text-[#d48b55] font-bold leading-5" aria-hidden="true">
          ·
        </span>
        <span className="flex-1 leading-relaxed">{renderInline(cleanBullet)}</span>
      </div>
    );
  }

  return (
    <p key={key} className="leading-relaxed">
      {renderInline(trimmed)}
    </p>
  );
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeExpert,
  settings,
  onUpdateSettings,
  messages,
  onSendMessage,
  isSending,
  selectedOccasion,
  onSelectOccasion,
  closetItems,
  guestProfile,
  weatherCondition,
  onSelectWeather,
  formalityLevel,
  onSelectFormality,
  useClosetOnly,
  onToggleUseClosetOnly,
  onGenerateOutfitPhoto,
  onOpenProfile,
  onSkipProfilePrompt,
}) => {
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Live voice conversation state
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('Connecting...');
  const [liveInputTranscript, setLiveInputTranscript] = useState<string>('');
  const [liveOutputTranscript, setLiveOutputTranscript] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Dictation WAV capture refs (+ MediaRecorder fallback)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const wavCtxRef = useRef<AudioContext | null>(null);
  const wavProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const wavSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const wavGainRef = useRef<GainNode | null>(null);
  const wavPcmChunksRef = useRef<Float32Array[]>([]);
  const wavSampleRateRef = useRef<number>(48000);

  // Live WebSocket voice refs
  const liveWsRef = useRef<WebSocket | null>(null);
  const liveReadyRef = useRef<boolean>(false);
  const liveActiveRef = useRef<boolean>(false);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveInputCtxRef = useRef<AudioContext | null>(null);
  const liveProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const liveSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const liveGainRef = useRef<GainNode | null>(null);
  const liveOutputCtxRef = useRef<AudioContext | null>(null);
  const liveNextStartTimeRef = useRef<number>(0);
  const liveActiveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const liveTurnFinishedRef = useRef<boolean>(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [activeExpert.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const stopLiveVoice = useCallback(() => {
    liveActiveRef.current = false;
    liveReadyRef.current = false;

    liveActiveSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore
      }
    });
    liveActiveSourcesRef.current.clear();
    liveNextStartTimeRef.current = 0;

    if (liveProcessorRef.current) {
      try {
        liveProcessorRef.current.disconnect();
      } catch {
        // ignore
      }
      liveProcessorRef.current.onaudioprocess = null;
      liveProcessorRef.current = null;
    }
    if (liveSourceRef.current) {
      try {
        liveSourceRef.current.disconnect();
      } catch {
        // ignore
      }
      liveSourceRef.current = null;
    }
    if (liveGainRef.current) {
      try {
        liveGainRef.current.disconnect();
      } catch {
        // ignore
      }
      liveGainRef.current = null;
    }
    if (liveInputCtxRef.current) {
      liveInputCtxRef.current.close().catch(() => {});
      liveInputCtxRef.current = null;
    }
    if (liveOutputCtxRef.current) {
      liveOutputCtxRef.current.close().catch(() => {});
      liveOutputCtxRef.current = null;
    }
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((track) => track.stop());
      liveStreamRef.current = null;
    }
    if (liveWsRef.current) {
      try {
        if (
          liveWsRef.current.readyState === WebSocket.OPEN ||
          liveWsRef.current.readyState === WebSocket.CONNECTING
        ) {
          liveWsRef.current.close();
        }
      } catch {
        // ignore
      }
      liveWsRef.current = null;
    }

    setIsLiveActive(false);
    setLiveStatus('Disconnected');
  }, []);

  const cleanupDictationResources = useCallback(() => {
    if (wavProcessorRef.current) {
      try {
        wavProcessorRef.current.disconnect();
      } catch {
        // ignore
      }
      wavProcessorRef.current.onaudioprocess = null;
      wavProcessorRef.current = null;
    }
    if (wavSourceRef.current) {
      try {
        wavSourceRef.current.disconnect();
      } catch {
        // ignore
      }
      wavSourceRef.current = null;
    }
    if (wavGainRef.current) {
      try {
        wavGainRef.current.disconnect();
      } catch {
        // ignore
      }
      wavGainRef.current = null;
    }
    if (wavCtxRef.current) {
      wavCtxRef.current.close().catch(() => {});
      wavCtxRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupDictationResources();
      stopLiveVoice();
    };
  }, [cleanupDictationResources, stopLiveVoice]);

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaError(null);

    if (file.size > 6 * 1024 * 1024) {
      setMediaError('Please select an image smaller than 6 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingImage(reader.result);
        onUpdateSettings({ ...settings, photosPermission: 'granted' });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const transcribeAndSendAudio = async (audioBase64: string) => {
    setIsTranscribing(true);
    try {
      const resp = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64 }),
      });
      const data = await resp.json();
      const transcribedText = typeof data.text === 'string' ? data.text.trim() : '';

      if (resp.ok && data.success && transcribedText) {
        const attachedImg = pendingImage;
        setPendingImage(undefined);
        setInputText('');
        onSendMessage(
          transcribedText,
          selectedOccasion,
          attachedImg,
          undefined,
          weatherCondition,
          formalityLevel,
          useClosetOnly
        );
      } else {
        setMediaError(
          data.error || 'Could not detect speech in the recording. Please speak clearly and try again.'
        );
      }
    } catch {
      setMediaError('Could not convert voice to text. Please try again or type your message.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleToggleRecording = async () => {
    setMediaError(null);
    if (isTranscribing || isSending) return;

    if (isLiveActive) {
      stopLiveVoice();
    }

    // Stop active recording and transcribe
    if (isRecording) {
      setIsRecording(false);

      if (wavCtxRef.current && wavProcessorRef.current) {
        const recordedChunks = [...wavPcmChunksRef.current];
        const sampleRate = wavSampleRateRef.current;
        wavPcmChunksRef.current = [];
        cleanupDictationResources();

        const totalSamples = recordedChunks.reduce((sum, c) => sum + c.length, 0);
        if (totalSamples < sampleRate * 0.25) {
          setMediaError('Recording was too short. Speak clearly for at least half a second.');
          return;
        }

        const wavDataUrl = encodeWavBase64(recordedChunks, sampleRate);
        await transcribeAndSendAudio(wavDataUrl);
        return;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      onUpdateSettings({ ...settings, micPermission: 'granted' });

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioCtx) {
        try {
          const audioCtx = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          const silentGain = audioCtx.createGain();
          silentGain.gain.value = 0;

          wavPcmChunksRef.current = [];
          wavSampleRateRef.current = audioCtx.sampleRate;

          processor.onaudioprocess = (ev) => {
            const channelData = ev.inputBuffer.getChannelData(0);
            wavPcmChunksRef.current.push(new Float32Array(channelData));
          };

          source.connect(processor);
          processor.connect(silentGain);
          silentGain.connect(audioCtx.destination);

          wavCtxRef.current = audioCtx;
          wavSourceRef.current = source;
          wavProcessorRef.current = processor;
          wavGainRef.current = silentGain;
          setIsRecording(true);
          return;
        } catch {
          // Fall back to MediaRecorder if Web Audio node setup fails
          cleanupDictationResources();
          mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      }

      const activeStream = mediaStreamRef.current;
      const preferredMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const chosenMimeType =
        typeof MediaRecorder !== 'undefined'
          ? preferredMimeTypes.find((t) => MediaRecorder.isTypeSupported(t))
          : undefined;

      const recorder = chosenMimeType
        ? new MediaRecorder(activeStream, { mimeType: chosenMimeType })
        : new MediaRecorder(activeStream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onerror = () => {
        cleanupDictationResources();
        setIsRecording(false);
        setMediaError('Microphone recording encountered an error. Please try again.');
      };

      recorder.onstop = () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        const rawType = (recorder.mimeType || chosenMimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(audioChunksRef.current, { type: rawType });
        audioChunksRef.current = [];

        if (blob.size < 200) {
          setMediaError('Recording was too short. Speak clearly before stopping.');
          return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
          if (typeof reader.result !== 'string') return;
          await transcribeAndSendAudio(reader.result);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      cleanupDictationResources();
      const errName = err instanceof DOMException ? err.name : '';
      onUpdateSettings({ ...settings, micPermission: 'denied' });
      setMediaError(
        errName === 'NotFoundError'
          ? 'No microphone device was detected.'
          : 'Microphone permission was denied. Allow microphone access in your browser to use voice input.'
      );
    }
  };

  const handleToggleLiveVoice = async () => {
    setMediaError(null);
    if (isLiveActive) {
      stopLiveVoice();
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      cleanupDictationResources();
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError('Live voice is not supported in this browser.');
      return;
    }

    try {
      setLiveInputTranscript('');
      setLiveOutputTranscript('');
      setLiveStatus('Requesting microphone...');
      setIsLiveActive(true);
      liveActiveRef.current = true;
      liveReadyRef.current = false;
      liveTurnFinishedRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!liveActiveRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      liveStreamRef.current = stream;
      onUpdateSettings({ ...settings, micPermission: 'granted' });

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      const inputCtx = new AudioCtx();
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      liveInputCtxRef.current = inputCtx;

      let outputCtx: AudioContext;
      try {
        outputCtx = new AudioCtx({ sampleRate: 24000 });
      } catch {
        outputCtx = new AudioCtx();
      }
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      liveOutputCtxRef.current = outputCtx;
      liveNextStartTimeRef.current = 0;

      setLiveStatus(`Connecting to ${activeExpert.name}...`);
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProto}//${window.location.host}/live`);
      liveWsRef.current = ws;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      const silentGain = inputCtx.createGain();
      silentGain.gain.value = 0;

      processor.onaudioprocess = (ev) => {
        if (!liveActiveRef.current || !liveReadyRef.current) return;
        const socket = liveWsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        const inputData = ev.inputBuffer.getChannelData(0);
        const resampled = resampleTo16k(inputData, inputCtx.sampleRate);
        const pcmBase64 = float32ToInt16PcmBase64(resampled);
        socket.send(JSON.stringify({ audio: pcmBase64 }));
      };

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(inputCtx.destination);
      liveSourceRef.current = source;
      liveProcessorRef.current = processor;
      liveGainRef.current = silentGain;

      ws.onopen = () => {
        const sanitizedUserProfile = {
          name: guestProfile.name,
          ...(guestProfile.heightCm !== undefined ? { heightCm: guestProfile.heightCm } : {}),
          ...(guestProfile.skinToneMonk !== undefined ? { skinToneMonk: guestProfile.skinToneMonk } : {}),
          ...(guestProfile.undertone ? { undertone: guestProfile.undertone } : {}),
          ...(guestProfile.bodyShape ? { bodyShape: guestProfile.bodyShape } : {}),
          ...(guestProfile.colorPreferences ? { colorPreferences: guestProfile.colorPreferences } : {}),
          ...(guestProfile.clothingPreferences ? { clothingPreferences: guestProfile.clothingPreferences } : {}),
        };
        ws.send(
          JSON.stringify({
            type: 'init',
            context: {
              expert: activeExpert,
              occasion: selectedOccasion,
              weather: weatherCondition,
              formality: formalityLevel,
              userProfile: sanitizedUserProfile,
              useClosetOnly,
              closetItems,
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data));

          if (msg.ready) {
            liveReadyRef.current = true;
            setLiveStatus(`Live with ${activeExpert.name} — Fashion & styling only`);
            return;
          }

          if (msg.inputTranscript) {
            if (liveTurnFinishedRef.current) {
              liveTurnFinishedRef.current = false;
              setLiveInputTranscript(msg.inputTranscript);
              setLiveOutputTranscript('');
            } else {
              setLiveInputTranscript((prev) => prev + msg.inputTranscript);
            }
          }

          if (msg.outputTranscript) {
            setLiveOutputTranscript((prev) => prev + msg.outputTranscript);
          }

          if (msg.audio && liveOutputCtxRef.current) {
            const outCtx = liveOutputCtxRef.current;
            if (outCtx.state === 'suspended') {
              void outCtx.resume();
            }
            const audioBuffer = decodePcm24kToAudioBuffer(outCtx, msg.audio);
            const startAt = Math.max(outCtx.currentTime, liveNextStartTimeRef.current);
            const bufSource = outCtx.createBufferSource();
            bufSource.buffer = audioBuffer;
            bufSource.connect(outCtx.destination);
            liveActiveSourcesRef.current.add(bufSource);
            bufSource.onended = () => {
              liveActiveSourcesRef.current.delete(bufSource);
            };
            bufSource.start(startAt);
            liveNextStartTimeRef.current = startAt + audioBuffer.duration;
          }

          if (msg.interrupted) {
            liveActiveSourcesRef.current.forEach((src) => {
              try {
                src.stop();
                src.disconnect();
              } catch {
                // ignore
              }
            });
            liveActiveSourcesRef.current.clear();
            liveNextStartTimeRef.current = 0;
          }

          if (msg.turnComplete) {
            liveTurnFinishedRef.current = true;
          }

          if (msg.error) {
            setMediaError(String(msg.error));
            stopLiveVoice();
          }

          if (msg.closed && liveActiveRef.current) {
            stopLiveVoice();
          }
        } catch {
          // ignore malformed WS frames
        }
      };

      ws.onerror = () => {
        if (liveActiveRef.current) {
          setMediaError('Live voice connection interrupted. Please try reconnecting.');
          stopLiveVoice();
        }
      };

      ws.onclose = () => {
        if (liveActiveRef.current) {
          stopLiveVoice();
        }
      };
    } catch (err) {
      stopLiveVoice();
      const errName = err instanceof DOMException ? err.name : '';
      onUpdateSettings({ ...settings, micPermission: 'denied' });
      setMediaError(
        errName === 'NotFoundError'
          ? 'No microphone device was detected.'
          : 'Microphone access is required for live voice styling sessions.'
      );
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSending || isTranscribing) return;
    if (!inputText.trim() && !pendingImage) return;

    onSendMessage(
      inputText.trim(),
      selectedOccasion,
      pendingImage,
      undefined,
      weatherCondition,
      formalityLevel,
      useClosetOnly
    );

    setInputText('');
    setPendingImage(undefined);
    setMediaError(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black">
      {/* Consultation Context Bar */}
      <div className="border-b border-stone-200 dark:border-zinc-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-3 bg-stone-50/60 dark:bg-[#0e0f12] shrink-0">
        <div className="flex items-center gap-2">
          <label htmlFor="occ-select" className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
            Occasion
          </label>
          <select
            id="occ-select"
            value={selectedOccasion}
            onChange={(e) => onSelectOccasion(e.target.value)}
            className="text-xs font-medium bg-white dark:bg-[#16171d] border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#d48b55]"
          >
            {OCCASIONS.map((occ) => (
              <option key={occ.id} value={occ.label}>
                {occ.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="weather-select" className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
            Weather
          </label>
          <select
            id="weather-select"
            value={weatherCondition}
            onChange={(e) => onSelectWeather(e.target.value as WeatherCondition)}
            className="text-xs font-medium bg-white dark:bg-[#16171d] border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#d48b55]"
          >
            {WEATHER_OPTIONS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="formality-select" className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
            Dress Code
          </label>
          <select
            id="formality-select"
            value={formalityLevel}
            onChange={(e) => onSelectFormality(e.target.value as FormalityLevel)}
            className="text-xs font-medium bg-white dark:bg-[#16171d] border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#d48b55]"
          >
            {FORMALITY_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => onToggleUseClosetOnly(!useClosetOnly)}
          aria-pressed={useClosetOnly}
          className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer whitespace-nowrap shrink-0 ${
            useClosetOnly
              ? 'bg-blue-700 dark:bg-[#8c4a1e] text-white border-transparent'
              : 'bg-white dark:bg-[#16171d] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Shirt className="w-3.5 h-3.5" />
          <span>Closet-Only ({closetItems.length})</span>
        </button>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="py-6 sm:py-10 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-[#111216]">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-200 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                  {!avatarFailed ? (
                    <img
                      src={activeExpert.avatar}
                      alt={activeExpert.name}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-bold text-stone-700 dark:text-stone-300">
                      {activeExpert.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <span className="font-semibold text-stone-900 dark:text-white text-base">
                      {activeExpert.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeExpert.role}</span>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {activeExpert.bio}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-stone-500 dark:text-stone-400">
                    <span>
                      Account: <strong className="font-semibold text-stone-700 dark:text-stone-200">{guestProfile.name}</strong>
                      {(() => {
                        const shared: string[] = [];
                        if (guestProfile.heightCm !== undefined) shared.push(`${guestProfile.heightCm} cm`);
                        if (guestProfile.skinToneMonk !== undefined) shared.push(`MST ${guestProfile.skinToneMonk}`);
                        if (guestProfile.undertone) shared.push(`${guestProfile.undertone} undertone`);
                        if (guestProfile.bodyShape) shared.push(guestProfile.bodyShape);
                        if (guestProfile.colorPreferences) shared.push(`Colors: ${guestProfile.colorPreferences}`);
                        if (guestProfile.clothingPreferences) shared.push(`Style: ${guestProfile.clothingPreferences}`);
                        return shared.length > 0
                          ? ` · ${shared.join(' · ')}`
                          : ' · No styling details shared (no estimates assumed)';
                      })()}
                    </span>
                    {onOpenProfile && (
                      <button
                        type="button"
                        onClick={onOpenProfile}
                        className="inline-flex items-center gap-1 text-blue-700 dark:text-[#d48b55] font-medium hover:underline cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>Optional Details</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!guestProfile.preferencesReviewed && onOpenProfile && (
                <div className="p-5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#111216] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
                      Optional Fit &amp; Style Details
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      Want more tailored outfit advice? You can share your <strong className="font-medium text-stone-800 dark:text-stone-100">height, skin tone, body shape, color preferences, or clothing preferences</strong> (if any). None of these are mandatory—skip anytime if you prefer not to share.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onSkipProfilePrompt && (
                      <button
                        type="button"
                        onClick={onSkipProfilePrompt}
                        className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition cursor-pointer whitespace-nowrap"
                      >
                        Skip — Don&apos;t Share
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onOpenProfile}
                      className="px-4 py-2 rounded-xl bg-stone-950 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition cursor-pointer whitespace-nowrap"
                    >
                      Share Optional Details
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Starter Prompts for {selectedOccasion}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeExpert.suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() =>
                        onSendMessage(
                          prompt,
                          selectedOccasion,
                          undefined,
                          undefined,
                          weatherCondition,
                          formalityLevel,
                          useClosetOnly
                        )
                      }
                      className="text-left p-4 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#111216] hover:border-blue-600/50 dark:hover:border-[#d48b55]/60 transition text-xs font-medium text-stone-800 dark:text-stone-200 leading-relaxed cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 space-y-3 ${
                      isUser
                        ? 'bg-stone-950 text-white dark:bg-[#8c4a1e] dark:text-white'
                        : 'bg-stone-50 dark:bg-[#111216] border border-stone-200 dark:border-zinc-800 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[11px] opacity-75">
                      <span className="font-semibold">
                        {isUser ? guestProfile.name : msg.expertName || activeExpert.name}
                      </span>
                      <span className="tabular-nums">
                        {msg.occasion ? `${msg.occasion} · ` : ''}
                        {msg.timestamp}
                      </span>
                    </div>

                    {msg.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-white/15 max-w-xs">
                        <img
                          src={msg.imageUrl}
                          alt="Uploaded outfit reference"
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}

                    {msg.hasAudio && (
                      <p className="text-xs italic opacity-85">Voice styling query attached</p>
                    )}

                    {msg.outfitName && !isUser && (
                      <p className="text-xs font-semibold text-blue-700 dark:text-[#d48b55]">
                        {msg.outfitName}
                      </p>
                    )}

                    <div className="text-sm space-y-1.5">
                      {msg.content.split('\n').map((line, idx) => renderFormattedLine(line, idx))}
                    </div>

                    {msg.generatedOutfitImageUrl && (
                      <div className="pt-2">
                        <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-700 bg-white">
                          <img
                            src={msg.generatedOutfitImageUrl}
                            alt={msg.outfitName || 'Generated lookbook sheet'}
                            referrerPolicy="no-referrer"
                            className="w-full h-auto block"
                          />
                        </div>
                      </div>
                    )}

                    {!isUser && msg.suggestedFormality && msg.suggestedFormality !== formalityLevel && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => onSelectFormality(msg.suggestedFormality!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 dark:bg-[#8c4a1e] text-white text-xs font-semibold hover:opacity-90 transition cursor-pointer whitespace-nowrap"
                        >
                          <span>
                            Switch Dress Code to{' '}
                            {FORMALITY_OPTIONS.find((f) => f.id === msg.suggestedFormality)?.label ||
                              msg.suggestedFormality}
                          </span>
                        </button>
                      </div>
                    )}

                    {!isUser && !msg.isOutOfScope && !msg.generatedOutfitImageUrl && (
                      <div className="pt-1">
                        <button
                          type="button"
                          disabled={msg.isGeneratingImage}
                          onClick={() => onGenerateOutfitPhoto(msg.id, msg.outfitName)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-zinc-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800 disabled:opacity-60 transition cursor-pointer whitespace-nowrap"
                        >
                          {msg.isGeneratingImage ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Rendering Lookbook Sheet...</span>
                            </>
                          ) : (
                            <>
                              <LayoutTemplate className="w-3.5 h-3.5 text-blue-700 dark:text-[#d48b55]" />
                              <span>Render Lookbook Sheet</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-stone-50 dark:bg-[#111216] border border-stone-200 dark:border-zinc-800 flex items-center gap-2.5 text-xs text-stone-600 dark:text-stone-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-700 dark:text-[#d48b55]" />
                <span>{activeExpert.name} is composing your styling note...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-stone-200 dark:border-zinc-800 px-4 sm:px-8 py-3.5 bg-white dark:bg-[#0c0c0e] shrink-0">
        <div className="max-w-3xl mx-auto space-y-2.5">
          {mediaError && (
            <p className="text-xs text-red-600 dark:text-red-400">{mediaError}</p>
          )}

          {isLiveActive && (
            <div className="rounded-xl border border-blue-200 dark:border-[#8c4a1e]/50 bg-blue-50/70 dark:bg-[#161210] px-3.5 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-blue-700 dark:text-[#d48b55] shrink-0" />
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {liveStatus}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopLiveVoice}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <PhoneOff className="w-3 h-3" />
                  <span>End Call</span>
                </button>
              </div>
              {(liveInputTranscript || liveOutputTranscript) && (
                <div className="text-xs space-y-1 pt-1 border-t border-blue-200/70 dark:border-zinc-800">
                  {liveInputTranscript && (
                    <p className="text-stone-600 dark:text-stone-400">
                      <span className="font-semibold text-stone-900 dark:text-stone-200">You: </span>
                      {liveInputTranscript}
                    </p>
                  )}
                  {liveOutputTranscript && (
                    <p className="text-stone-700 dark:text-stone-300">
                      <span className="font-semibold text-blue-700 dark:text-[#d48b55]">
                        {activeExpert.name}:{' '}
                      </span>
                      {liveOutputTranscript}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {(isRecording || isTranscribing) && (
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-[#d48b55] font-medium">
              {isTranscribing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Converting voice to text and sending...</span>
                </>
              ) : (
                <span>Listening... click the stop button to convert your voice to text and send.</span>
              )}
            </div>
          )}

          {pendingImage && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative inline-block">
                <img
                  src={pendingImage}
                  alt="Selected garment"
                  className="h-14 w-14 rounded-lg object-cover border border-stone-300 dark:border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => setPendingImage(undefined)}
                  aria-label="Remove attached photo"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelected}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach garment or outfit photo"
              title="Attach outfit photo"
              className="p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
            >
              <ImagePlus className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={isTranscribing || isSending}
              onClick={handleToggleRecording}
              aria-label={isRecording ? 'Stop and send voice input' : 'Record voice input'}
              title={isRecording ? 'Stop & send voice as text' : 'Speak to send as text'}
              className={`p-2.5 rounded-xl border transition cursor-pointer shrink-0 disabled:opacity-50 ${
                isRecording
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <Square className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              disabled={isTranscribing}
              onClick={handleToggleLiveVoice}
              aria-label={isLiveActive ? 'End live voice call' : 'Start live voice conversation'}
              title={isLiveActive ? 'End live voice session' : 'Live Voice call with stylist'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50 ${
                isLiveActive
                  ? 'bg-blue-700 dark:bg-[#8c4a1e] border-transparent text-white'
                  : 'border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              {isLiveActive ? (
                <PhoneOff className="w-4 h-4" />
              ) : (
                <Phone className="w-4 h-4 text-blue-700 dark:text-[#d48b55]" />
              )}
              <span className="hidden md:inline">{isLiveActive ? 'Live On' : 'Live Voice'}</span>
            </button>

            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                useClosetOnly
                  ? `Ask ${activeExpert.name} to style pieces from your closet...`
                  : `Ask ${activeExpert.name} about fit, color pairings, or today's look...`
              }
              className="flex-1 resize-none rounded-xl bg-stone-50 dark:bg-[#16171d] border border-stone-200 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-[#d48b55]"
            />

            <button
              type="submit"
              disabled={isSending || isTranscribing || (!inputText.trim() && !pendingImage)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-950 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 disabled:opacity-45 transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
