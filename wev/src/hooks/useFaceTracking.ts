import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { Face } from 'kalidokit';

interface FaceTrackingData {
  isActive: boolean;
  blendShapes: Record<string, number>;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}

interface UseFaceTrackingProps {
  onUpdate?: (data: FaceTrackingData) => void;
  lowResolution?: boolean;
}

export const useFaceTracking = ({ onUpdate, lowResolution = true }: UseFaceTrackingProps = {}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const frameCountRef = useRef<number>(0);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // カメラストリームの初期化
  const initCamera = useCallback(async () => {
    try {
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // 軽量化のため低解像度設定
      const constraints = {
        video: {
          width: lowResolution ? 640 : 1280,
          height: lowResolution ? 480 : 720,
          facingMode: 'user'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      
      return new Promise<void>((resolve, reject) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play()
              .then(() => resolve())
              .catch(reject);
          };
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera access failed';
      setError(errorMessage);
      throw err;
    }
  }, [lowResolution]);

  // MediaPipe Face Meshの初期化
  const initFaceMesh = useCallback(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    // 軽量化設定
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false, // 軽量化のため精度を下げる
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // トラッキング結果のコールバック
    faceMesh.onResults((results) => {
      // フレーム間引き処理（2〜3フレームに1回更新）
      frameCountRef.current++;
      if (frameCountRef.current % 3 !== 0) {
        return;
      }

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        try {
          // Kalidokitを使用してBlendShapeに変換
          const face = Face.solve(landmarks, {
            runtime: 'mediapipe',
            video: videoRef.current
          });

          if (face) {
            const trackingData: FaceTrackingData = {
              isActive: true,
              blendShapes: {
                // 目の動き
                eyeBlinkLeft: face.eye.l || 0,
                eyeBlinkRight: face.eye.r || 0,
                eyeLookUpLeft: Math.max(0, face.pupil.y || 0),
                eyeLookUpRight: Math.max(0, face.pupil.y || 0),
                eyeLookDownLeft: Math.max(0, -(face.pupil.y || 0)),
                eyeLookDownRight: Math.max(0, -(face.pupil.y || 0)),
                eyeLookInLeft: Math.max(0, face.pupil.x || 0),
                eyeLookInRight: Math.max(0, -(face.pupil.x || 0)),
                eyeLookOutLeft: Math.max(0, -(face.pupil.x || 0)),
                eyeLookOutRight: Math.max(0, face.pupil.x || 0),
                
                // 口の動き
                mouthOpen: face.mouth.shape.A || 0,
                mouthSmileLeft: face.mouth.shape.I || 0,
                mouthSmileRight: face.mouth.shape.I || 0,
                mouthFunnel: face.mouth.shape.O || 0,
                mouthPucker: face.mouth.shape.U || 0,
                
                // 眉の動き
                browDownLeft: Math.max(0, -(face.brow || 0)),
                browDownRight: Math.max(0, -(face.brow || 0)),
                browUpCenter: Math.max(0, face.brow || 0),
                browUpLeft: Math.max(0, face.brow || 0),
                browUpRight: Math.max(0, face.brow || 0)
              },
              rotation: {
                x: face.head.degrees.x || 0,
                y: face.head.degrees.y || 0,
                z: face.head.degrees.z || 0
              },
              position: {
                x: face.head.position.x || 0,
                y: face.head.position.y || 0,
                z: face.head.position.z || 0
              }
            };

            onUpdate?.(trackingData);
            setIsTracking(true);
          }
        } catch (kalidokitError) {
          console.warn('Kalidokit processing error:', kalidokitError);
          // エラーが発生した場合は無効なデータとして処理
          onUpdate?.({
            isActive: false,
            blendShapes: {},
            rotation: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 }
          });
          setIsTracking(false);
        }
      } else {
        // 顔が検出されない場合
        onUpdate?.({
          isActive: false,
          blendShapes: {},
          rotation: { x: 0, y: 0, z: 0 },
          position: { x: 0, y: 0, z: 0 }
        });
        setIsTracking(false);
      }
    });

    faceMeshRef.current = faceMesh;
    return faceMesh;
  }, [onUpdate]);

  // カメラとFaceMeshの初期化
  const initialize = useCallback(async () => {
    try {
      setError(null);
      
      await initCamera();
      initFaceMesh();
      
      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && faceMeshRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: lowResolution ? 640 : 1280,
          height: lowResolution ? 480 : 720
        });
        
        camera.start();
        cameraRef.current = camera;
      }
      
      setIsInitialized(true);
    } catch (err) {
      console.error('Face tracking initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Initialization failed');
    }
  }, [initCamera, initFaceMesh, lowResolution]);

  // トラッキングの停止
  const stop = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsInitialized(false);
    setIsTracking(false);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    videoRef,
    canvasRef,
    isInitialized,
    isTracking,
    error,
    initialize,
    stop
  };
};