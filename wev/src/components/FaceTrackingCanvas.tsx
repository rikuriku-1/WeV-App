import React, { useEffect } from 'react';
import { useFaceTracking } from '../hooks/useFaceTracking';

interface FaceTrackingCanvasProps {
  onTrackingUpdate?: (data: any) => void;
  visible?: boolean;
}

const FaceTrackingCanvas: React.FC<FaceTrackingCanvasProps> = ({ 
  onTrackingUpdate, 
  visible = true 
}) => {
  const {
    videoRef,
    canvasRef,
    isInitialized,
    isTracking,
    error,
    initialize,
    stop
  } = useFaceTracking({
    onUpdate: onTrackingUpdate,
    lowResolution: true // 軽量化のため低解像度
  });

  // 自動初期化
  useEffect(() => {
    if (!isInitialized && !error) {
      initialize();
    }
  }, [initialize, isInitialized, error]);

  return (
    <div 
      className="face-tracking-canvas"
      style={{
        position: 'absolute',
        top: visible ? '20px' : '-1000px',
        left: visible ? '20px' : '-1000px',
        width: '320px',
        height: '240px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        overflow: 'hidden',
        zIndex: visible ? 200 : -1,
        border: isTracking ? '2px solid #00ff00' : '2px solid #ff6600'
      }}
    >
      {/* カメラビデオ */}
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)' // ミラー表示
        }}
        muted
        playsInline
      />
      
      {/* MediaPipe用の非表示Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'none'
        }}
      />

      {/* ステータス表示 */}
      <div
        style={{
          position: 'absolute',
          top: '5px',
          left: '5px',
          right: '5px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          textAlign: 'center'
        }}
      >
        {error ? (
          <span style={{ color: '#ff4444' }}>Error: {error}</span>
        ) : !isInitialized ? (
          <span style={{ color: '#ffaa00' }}>Initializing...</span>
        ) : isTracking ? (
          <span style={{ color: '#00ff00' }}>● Tracking Active</span>
        ) : (
          <span style={{ color: '#ff6600' }}>○ No Face Detected</span>
        )}
      </div>

      {/* 再試行ボタン */}
      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={() => {
              stop();
              setTimeout(initialize, 1000);
            }}
            style={{
              padding: '4px 12px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default FaceTrackingCanvas;