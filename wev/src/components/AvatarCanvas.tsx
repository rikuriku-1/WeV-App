import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Stats from 'stats.js';
import FaceTrackingCanvas from './FaceTrackingCanvas';

interface AvatarCanvasProps {
  onFPSUpdate: (fps: number) => void;
}

interface FaceTrackingData {
  isActive: boolean;
  blendShapes: Record<string, number>;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}

const AvatarCanvas: React.FC<AvatarCanvasProps> = ({ onFPSUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const statsRef = useRef<Stats | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFaceTracking, setShowFaceTracking] = useState(false);
  const [currentTrackingData, setCurrentTrackingData] = useState<FaceTrackingData | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 軽量化設定を適用したレンダラーの初期化
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false, // 軽量化のためアンチエイリアス無効
      alpha: true,
      preserveDrawingBuffer: true, // OBS取り込み用
      powerPreference: 'high-performance'
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ピクセル比制限
    renderer.shadowMap.enabled = false; // 軽量化のためシャドウ無効
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

    // シーン設定
    const scene = new THREE.Scene();
    scene.background = null; // 透明背景（Green Backgroundはcssで設定）
    sceneRef.current = scene;

    // カメラ設定
    const camera = new THREE.PerspectiveCamera(
      30, // FOV - 軽量化のため狭く設定
      window.innerWidth / window.innerHeight,
      0.1,
      20
    );
    camera.position.set(0, 1.4, 3);
    cameraRef.current = camera;

    // 軽量な照明設定
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = false; // 軽量化のためシャドウ無効
    scene.add(directionalLight);

    // FPS監視用のStats初期化
    const stats = new Stats();
    stats.showPanel(0); // FPS表示
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '10px';
    stats.dom.style.right = '10px';
    stats.dom.style.zIndex = '1000';
    document.body.appendChild(stats.dom);
    statsRef.current = stats;

    // VRMローダーの設定
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    // デフォルトVRMモデルの読み込み（後でサンプルモデルを配置予定）
    loadDefaultVRM(loader, scene);

    // レンダリングループ
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (statsRef.current) {
        statsRef.current.begin();
        // FPS値をコールバックで更新
        onFPSUpdate(Math.round(1 / clockRef.current.getDelta()));
      }

      const deltaTime = clockRef.current.getDelta();
      
      // VRMモデルの更新
      if (vrmRef.current) {
        // フェイストラッキングデータの適用
        if (currentTrackingData && currentTrackingData.isActive) {
          applyBlendShapes(vrmRef.current, currentTrackingData.blendShapes);
          applyHeadRotation(vrmRef.current, currentTrackingData.rotation);
        }
        
        vrmRef.current.update(deltaTime);
      }

      // レンダリング（フレームレート制限：30fps目標）
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      if (statsRef.current) {
        statsRef.current.end();
      }
    };

    animate();

    // リサイズ処理
    const handleResize = () => {
      if (rendererRef.current && cameraRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // クリーンアップ
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (statsRef.current && statsRef.current.dom.parentNode) {
        statsRef.current.dom.parentNode.removeChild(statsRef.current.dom);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [onFPSUpdate, currentTrackingData]);

  // BlendShapeをVRMに適用する関数
  const applyBlendShapes = (vrm: VRM, blendShapes: Record<string, number>) => {
    if (!vrm.expressionManager) return;

    Object.entries(blendShapes).forEach(([shapeName, value]) => {
      // VRM標準BlendShape名にマッピング
      const vrmBlendShapeName = mapToVRMBlendShape(shapeName);
      if (vrmBlendShapeName && vrm.expressionManager) {
        try {
          vrm.expressionManager.setValue(vrmBlendShapeName, Math.max(0, Math.min(1, value)));
        } catch (err) {
          // BlendShapeが存在しない場合は無視
        }
      }
    });
  };

  // 頭の回転をVRMに適用する関数
  const applyHeadRotation = (vrm: VRM, rotation: { x: number; y: number; z: number }) => {
    if (!vrm.humanoid) return;

    const head = vrm.humanoid.getNormalizedBoneNode('head');
    if (head) {
      // 回転値を適切にスケーリング（度からラジアンに変換）
      head.rotation.x = THREE.MathUtils.degToRad(rotation.x * 0.5);
      head.rotation.y = THREE.MathUtils.degToRad(rotation.y * 0.5);
      head.rotation.z = THREE.MathUtils.degToRad(rotation.z * 0.5);
    }
  };

  // BlendShape名をVRM標準名にマッピング
  const mapToVRMBlendShape = (shapeName: string): string | null => {
    const mapping: Record<string, string> = {
      // 目
      'eyeBlinkLeft': 'blinkLeft',
      'eyeBlinkRight': 'blinkRight',
      'eyeLookUpLeft': 'lookUp',
      'eyeLookUpRight': 'lookUp',
      'eyeLookDownLeft': 'lookDown',
      'eyeLookDownRight': 'lookDown',
      'eyeLookInLeft': 'lookLeft',
      'eyeLookInRight': 'lookRight',
      'eyeLookOutLeft': 'lookRight',
      'eyeLookOutRight': 'lookLeft',
      
      // 口
      'mouthOpen': 'aa',
      'mouthSmileLeft': 'joy',
      'mouthSmileRight': 'joy',
      'mouthFunnel': 'oh',
      'mouthPucker': 'ou',
      
      // 眉
      'browDownLeft': 'angry',
      'browDownRight': 'angry',
      'browUpCenter': 'surprised',
      'browUpLeft': 'surprised',
      'browUpRight': 'surprised'
    };

    return mapping[shapeName] || null;
  };

  // フェイストラッキングデータのハンドラー
  const handleFaceTrackingUpdate = (data: FaceTrackingData) => {
    setCurrentTrackingData(data);
  };

  // デフォルトVRMモデルの読み込み関数
  const loadDefaultVRM = async (loader: GLTFLoader, scene: THREE.Scene) => {
    try {
      setIsLoading(true);
      
      // 暫定的にプリミティブキューブを配置（実際のVRMモデルが配置されるまで）
      const geometry = new THREE.BoxGeometry(0.5, 1.8, 0.3);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x88ccff,
        side: THREE.FrontSide // 軽量化のため裏面カリング
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 0.9, 0);
      scene.add(cube);

      // 簡易顔の表現
      const faceGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const faceMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffddaa,
        side: THREE.FrontSide // 軽量化のため裏面カリング
      });
      const face = new THREE.Mesh(faceGeometry, faceMaterial);
      face.position.set(0, 1.6, 0.1);
      scene.add(face);

      // 目の表現
      const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
      const eyeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide
      });
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.05, 1.65, 0.22);
      scene.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.05, 1.65, 0.22);
      scene.add(rightEye);

      setIsLoading(false);
      console.log('Default primitive model loaded');
      
      // 実際のVRMファイルの読み込み処理は後で実装
      // loadVRMFile('/models/sample.vrm', loader, scene);
      
    } catch (err) {
      console.error('Error loading default model:', err);
      setError('Failed to load avatar model');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '20px',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          Loading Avatar...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'red',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          Error: {error}
        </div>
      )}

      {/* フェイストラッキングキャンバス */}
      <FaceTrackingCanvas 
        onTrackingUpdate={handleFaceTrackingUpdate}
        visible={showFaceTracking}
      />

      {/* フェイストラッキング表示切り替えボタン */}
      <button
        onClick={() => setShowFaceTracking(!showFaceTracking)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '120px',
          background: showFaceTracking ? '#28a745' : '#6c757d',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 300
        }}
      >
        {showFaceTracking ? 'Hide Camera' : 'Show Camera'}
      </button>
    </div>
  );
};

export default AvatarCanvas;