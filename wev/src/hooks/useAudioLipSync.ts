import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioLipSyncData {
  volume: number;
  visemeA: number;
  visemeI: number;
  visemeU: number;
  visemeE: number;
  visemeO: number;
}

interface UseAudioLipSyncProps {
  onUpdate?: (data: AudioLipSyncData) => void;
  enabled?: boolean;
}

export const useAudioLipSync = ({ onUpdate, enabled = true }: UseAudioLipSyncProps = {}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 音声解析とViseme生成
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !enabled) {
      return;
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // 簡易音量計算
    let sum = 0;
    for (const value of dataArrayRef.current) {
      sum += value;
    }
    const averageVolume = sum / dataArrayRef.current.length;
    const normalizedVolume = averageVolume / 255;

    // 軽量化のため、音量ベースの簡易Viseme生成
    // 実際の音素解析は行わず、音量の変化パターンから推定
    const volume = normalizedVolume;
    const volumeSmoothed = Math.pow(volume, 0.7); // スムージング
    
    // 簡易Viseme推定（音量ベース）
    const audioLipSyncData: AudioLipSyncData = {
      volume: volumeSmoothed,
      visemeA: volumeSmoothed > 0.1 ? volumeSmoothed * 0.8 : 0, // 大きな口の動き
      visemeI: volumeSmoothed > 0.05 ? volumeSmoothed * 0.6 : 0, // 中程度の口の動き
      visemeU: volumeSmoothed > 0.03 ? volumeSmoothed * 0.4 : 0, // 小さな口の動き
      visemeE: volumeSmoothed > 0.07 ? volumeSmoothed * 0.5 : 0, // 横に広がる口の動き
      visemeO: volumeSmoothed > 0.04 ? volumeSmoothed * 0.7 : 0  // 丸い口の動き
    };

    onUpdate?.(audioLipSyncData);

    // 次フレームをスケジュール（軽量化のため30fps制限）
    animationFrameRef.current = requestAnimationFrame(() => {
      setTimeout(analyzeAudio, 33); // 約30fps
    });
  }, [onUpdate, enabled]);

  // マイクの初期化
  const initializeMicrophone = useCallback(async () => {
    try {
      setError(null);

      // AudioContextの作成
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // マイクアクセス
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // 軽量化のため低サンプリングレート
        }
      });
      
      streamRef.current = stream;

      // 音声解析ノードの設定
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      
      // 軽量化設定
      analyser.fftSize = 256; // 小さなFFTサイズで軽量化
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      
      analyserRef.current = analyser;
      microphoneRef.current = source;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      setIsInitialized(true);
      setIsActive(true);

      // 音声解析開始
      analyzeAudio();

      console.log('Audio lip sync initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Microphone access failed';
      setError(errorMessage);
      console.error('Audio lip sync initialization failed:', err);
    }
  }, [analyzeAudio]);

  // 停止
  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    microphoneRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;

    setIsInitialized(false);
    setIsActive(false);
  }, []);

  // 有効/無効の切り替え
  useEffect(() => {
    if (enabled && !isInitialized) {
      initializeMicrophone();
    } else if (!enabled && isInitialized) {
      stop();
    }
  }, [enabled, isInitialized, initializeMicrophone, stop]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isInitialized,
    isActive,
    error,
    initialize: initializeMicrophone,
    stop
  };
};