import { useState, useEffect, useRef, useCallback } from 'react';
import { WeightingMode, ResponseSpeed, MeterStats } from '../types';

export function useSoundMeter() {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User-adjustable display calibration, persisted on-device
  const [offsetDb, setOffsetDbState] = useState<number>(() => {
    const saved = localStorage.getItem('crowdvibe_offset_db');
    const parsed = saved === null ? 20 : Number(saved);
    return Number.isFinite(parsed) ? Math.max(-20, Math.min(50, parsed)) : 20;
  });
  const offsetDbRef = useRef<number>(offsetDb);

  const setOffsetDb = useCallback((value: number) => {
    const safeValue = Math.max(-20, Math.min(50, Math.round(value)));
    offsetDbRef.current = safeValue;
    setOffsetDbState(safeValue);
    localStorage.setItem('crowdvibe_offset_db', String(safeValue));
  }, []);

  const [weighting, setWeighting] = useState<WeightingMode>('A');
  const [speed, setSpeed] = useState<ResponseSpeed>('FAST');

  const [rawDetectedDb, setRawDetectedDb] = useState<number>(38.0);
  const rawDbRef = useRef<number>(38.0);

  const [stats, setStats] = useState<MeterStats>({
    current: 48.0,
    min: 48.0,
    max: 48.0,
    avg: 48.0,
    peak: 48.0,
    history: Array(60).fill(48.0),
  });

  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(32));

  // Audio Context & Nodes Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const filterChainRef = useRef<BiquadFilterNode[]>([]);

  // Measurement State Refs for high-speed RAF loop
  const smoothedDbRef = useRef<number>(48.0);
  const minDbRef = useRef<number>(999.0);
  const maxDbRef = useRef<number>(0.0);
  const peakDbRef = useRef<number>(48.0);
  const energySumRef = useRef<number>(0);
  const energyCountRef = useRef<number>(0);
  const historyRef = useRef<number[]>(Array(60).fill(48.0));
  const lastTimeRef = useRef<number>(performance.now());
  const lastHistoryPushRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(true);
  const speedRef = useRef<ResponseSpeed>('FAST');
  const isSimulatedRef = useRef<boolean>(false);
  const simPhaseRef = useRef<number>(0);

  // Sync ref values
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Build filter chain for A, C, or Z weighting
  const setupFilters = useCallback((context: AudioContext, source: MediaStreamAudioSourceNode, mode: WeightingMode) => {
    // Disconnect old filters
    filterChainRef.current.forEach(filter => {
      try {
        filter.disconnect();
      } catch {}
    });
    filterChainRef.current = [];

    if (!analyserRef.current) return;

    if (mode === 'Z') {
      // Z-weighting: flat frequency response
      source.connect(analyserRef.current);
    } else if (mode === 'C') {
      // C-weighting: standard acoustic approximation (31.5 Hz highpass, 8000 Hz lowpass)
      const hp = context.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 31.5;

      const lp = context.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 8000;

      source.connect(hp);
      hp.connect(lp);
      lp.connect(analyserRef.current);
      filterChainRef.current = [hp, lp];
    } else {
      // A-weighting: standard acoustic curve (simulating ear sensitivity: cuts sub-bass, boosts 2.5-3kHz, shelves high)
      const hp1 = context.createBiquadFilter();
      hp1.type = 'highpass';
      hp1.frequency.value = 200;
      hp1.Q.value = 0.7;

      const peak = context.createBiquadFilter();
      peak.type = 'peaking';
      peak.frequency.value = 2800;
      peak.Q.value = 1.2;
      peak.gain.value = 3.5;

      const lp1 = context.createBiquadFilter();
      lp1.type = 'lowpass';
      lp1.frequency.value = 12000;
      lp1.Q.value = 0.7;

      source.connect(hp1);
      hp1.connect(peak);
      peak.connect(lp1);
      lp1.connect(analyserRef.current);
      filterChainRef.current = [hp1, peak, lp1];
    }
  }, []);

  // Update weighting filter when mode changes
  useEffect(() => {
    if (audioContextRef.current && sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
        setupFilters(audioContextRef.current, sourceNodeRef.current, weighting);
      } catch (err) {
        console.error('Failed to update acoustic weighting filter:', err);
      }
    }
  }, [weighting, setupFilters]);

  // Request Microphone and start engine
  const startAudio = useCallback(async () => {
    setIsInitializing(true);
    setErrorMessage(null);

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Request raw, unadulterated microphone stream without browser noise reduction
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      mediaStreamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0; // Raw real-time signal, time constant handled dynamically
      analyserRef.current = analyser;

      setupFilters(ctx, source, weighting);

      setHasPermission(true);
      isSimulatedRef.current = false;
      setIsInitializing(false);
    } catch (err: unknown) {
      console.warn('Microphone access unavailable or denied, enabling realistic acoustic sensor simulation:', err);
      setHasPermission(false);
      isSimulatedRef.current = true;
      setIsInitializing(false);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Microphone permission required for direct hardware capture.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage('No physical microphone found on this device.');
        }
      }
    }
  }, [setupFilters, weighting]);

  // Reset metrics
  const resetStats = useCallback(() => {
    const cur = smoothedDbRef.current || 48.0;
    minDbRef.current = cur;
    maxDbRef.current = cur;
    peakDbRef.current = cur;
    energySumRef.current = Math.pow(10, cur / 10);
    energyCountRef.current = 1;
    historyRef.current = Array(60).fill(cur);
    setStats({
      current: cur,
      min: cur,
      max: cur,
      avg: cur,
      peak: cur,
      history: [...historyRef.current],
    });
  }, []);

  // Initialize on mount
  useEffect(() => {
    startAudio();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [startAudio]);

  // RAF Measurement Loop
  useEffect(() => {
    let animationFrameId: number;
    const timeBuffer = new Float32Array(2048);
    const freqBuffer = new Uint8Array(32);

    const updateMeter = (now: number) => {
      const dt = Math.min(Math.max((now - lastTimeRef.current) / 1000, 0.001), 0.1);
      lastTimeRef.current = now;

      if (isRunningRef.current) {
        let detectedDb = 35.0;

        if (!isSimulatedRef.current && analyserRef.current) {
          analyserRef.current.getFloatTimeDomainData(timeBuffer);

          let sumSquares = 0;
          for (let i = 0; i < timeBuffer.length; i++) {
            const sample = timeBuffer[i];
            sumSquares += sample * sample;
          }
          const rms = Math.sqrt(sumSquares / timeBuffer.length);

          // Calibrated real-time decibel Sound Pressure Level (dBSPL) relative to mobile microphone reference:
          // quiet ambient is ~30-38 dB detected, conversational speech is ~60-68 dB detected, loud shout is ~85-90 dB detected
          const rawDb = 20 * Math.log10(Math.max(rms, 1e-6)) + 106.0;
          detectedDb = Math.max(28.0, Math.min(115.0, rawDb));

          // Also sample frequency spectrum for dynamic meters
          analyserRef.current.getByteFrequencyData(freqBuffer);
          setFrequencyData(new Uint8Array(freqBuffer.slice(0, 32)));
        } else {
          // Fallback realistic acoustic simulation when physical mic is not connected/denied
          simPhaseRef.current += dt * 2.5;
          const ambientBase = 38.0;
          const fluctuation = Math.sin(simPhaseRef.current * 0.7) * 4.2 +
                              Math.cos(simPhaseRef.current * 1.9) * 2.8 +
                              Math.sin(simPhaseRef.current * 4.3) * 1.5 +
                              (Math.random() - 0.5) * 2.0;
          detectedDb = Math.max(30.0, ambientBase + fluctuation);
        }

        rawDbRef.current = Math.round(detectedDb * 10) / 10;
        const currentOffset = offsetDbRef.current;
        const measuredDb = detectedDb + currentOffset;

        // Exponential smoothing based on standard IEC response time weighting
        // FAST: 125ms (0.125s), SLOW: 1000ms (1.0s)
        const tau = speedRef.current === 'FAST' ? 0.125 : 1.0;
        const alpha = 1 - Math.exp(-dt / tau);

        smoothedDbRef.current = smoothedDbRef.current + alpha * (measuredDb - smoothedDbRef.current);
        const currentVal = Math.round(smoothedDbRef.current * 10) / 10;

        // Min & Max calculations
        if (minDbRef.current === 999.0 || currentVal < minDbRef.current) {
          minDbRef.current = currentVal;
        }
        if (currentVal > maxDbRef.current) {
          maxDbRef.current = currentVal;
        }

        // Peak hold with slow decay (decay ~3.5 dB per second)
        if (currentVal > peakDbRef.current) {
          peakDbRef.current = currentVal;
        } else {
          peakDbRef.current = Math.max(currentVal, peakDbRef.current - dt * 3.5);
        }

        // Equivalent Continuous Sound Level (Leq / Energetic Average)
        energySumRef.current += Math.pow(10, currentVal / 10);
        energyCountRef.current += 1;
        const energeticAvg = 10 * Math.log10(energySumRef.current / energyCountRef.current);
        const avgVal = Math.round(energeticAvg * 10) / 10;

        // History rolling buffer update (every ~180ms)
        if (now - lastHistoryPushRef.current > 180) {
          lastHistoryPushRef.current = now;
          historyRef.current = [...historyRef.current.slice(1), currentVal];
          setRawDetectedDb(rawDbRef.current);
        }

        setStats({
          current: currentVal,
          min: minDbRef.current === 999.0 ? currentVal : minDbRef.current,
          max: maxDbRef.current,
          avg: avgVal,
          peak: Math.round(peakDbRef.current * 10) / 10,
          history: [...historyRef.current],
        });
      }

      animationFrameId = requestAnimationFrame(updateMeter);
    };

    animationFrameId = requestAnimationFrame(updateMeter);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  return {
    stats,
    rawDetectedDb,
    frequencyData,
    isRunning,
    hasPermission,
    isInitializing,
    errorMessage,
    weighting,
    speed,
    setWeighting,
    setSpeed,
    toggleRunning,
    resetStats,
    startAudio,
    offsetDb,
    setOffsetDb,
  };
}
