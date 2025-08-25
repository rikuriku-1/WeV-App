import React, { useState } from 'react';
import { useAudioLipSync } from '../hooks/useAudioLipSync';

interface UIControlsProps {
  fps: number;
  onToggleUI: () => void;
  onVRMLoad?: (file: File) => void;
}

const UIControls: React.FC<UIControlsProps> = ({ fps, onToggleUI, onVRMLoad }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [faceTrackingEnabled, setFaceTrackingEnabled] = useState(true);
  const [lipSyncEnabled, setLipSyncEnabled] = useState(false);
  const [lowResolutionMode, setLowResolutionMode] = useState(true);

  // 音声リップシンク
  const { isActive: lipSyncActive, error: lipSyncError } = useAudioLipSync({
    enabled: lipSyncEnabled,
    onUpdate: (data) => {
      // 音声リップシンクデータをVRMに送信（後で実装）
      console.log('Lip sync data:', data);
    }
  });

  const handleVRMFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onVRMLoad) {
      onVRMLoad(file);
    }
  };

  return (
    <div className="ui-controls">
      {/* FPS表示 */}
      <div className="fps-display">
        FPS: {fps}
      </div>

      {/* メインコントロールパネル */}
      <div className={`control-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
          <h3>WeV Controls</h3>
          <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>

        {isExpanded && (
          <div className="panel-content">
            {/* カメラ・トラッキング設定セクション */}
            <div className="section">
              <h4>Face Tracking</h4>
              <div className="checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={faceTrackingEnabled}
                    onChange={(e) => setFaceTrackingEnabled(e.target.checked)}
                  />
                  Enable Face Tracking
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={lowResolutionMode}
                    onChange={(e) => setLowResolutionMode(e.target.checked)}
                  />
                  Low Resolution Mode
                </label>
              </div>
              <div className="info">
                Status: {faceTrackingEnabled ? 'Active' : 'Disabled'}
              </div>
            </div>

            {/* VRMモデル設定セクション */}
            <div className="section">
              <h4>VRM Model</h4>
              <input 
                type="file" 
                accept=".vrm" 
                style={{ display: 'none' }}
                id="vrm-upload"
                onChange={handleVRMFileChange}
              />
              <label htmlFor="vrm-upload" className="btn btn-secondary">
                Load VRM File
              </label>
              <div className="info">
                Current: Default Model
              </div>
            </div>

            {/* 音声リップシンク設定 */}
            <div className="section">
              <h4>Audio Lip Sync</h4>
              <div className="checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={lipSyncEnabled}
                    onChange={(e) => setLipSyncEnabled(e.target.checked)}
                  />
                  Enable Lip Sync
                </label>
              </div>
              <div className="info">
                Status: {lipSyncError ? `Error: ${lipSyncError}` : lipSyncActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            {/* 背景設定 */}
            <div className="section">
              <h4>Background</h4>
              <div className="radio-group">
                <label>
                  <input type="radio" name="background" value="green" defaultChecked />
                  Green Screen
                </label>
              </div>
            </div>

            {/* パフォーマンス設定 */}
            <div className="section">
              <h4>Performance</h4>
              <div className="slider-group">
                <label>
                  Frame Rate Limit: 30 FPS
                  <input type="range" min="15" max="60" defaultValue="30" />
                </label>
                <label>
                  Texture Quality: Low
                  <select defaultValue="low">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="section actions">
              <button className="btn btn-warning" onClick={onToggleUI}>
                Hide UI (Space)
              </button>
              <button className="btn btn-info">
                Reset Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 操作ヘルプ */}
      <div className="help-panel">
        <div className="help-item">
          <span className="key">SPACE</span>
          <span className="desc">Toggle UI</span>
        </div>
      </div>

      <style>{`
        .ui-controls {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 100;
        }

        .fps-display {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: #00ff00;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          pointer-events: auto;
          min-width: 80px;
          text-align: center;
        }

        .control-panel {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.9);
          border-radius: 8px;
          overflow: hidden;
          pointer-events: auto;
          max-width: 320px;
        }

        .panel-header {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.1);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          user-select: none;
        }

        .panel-header h3 {
          margin: 0;
          color: white;
          font-size: 16px;
        }

        .toggle-icon {
          color: #ccc;
          font-size: 12px;
        }

        .panel-content {
          padding: 16px;
          color: white;
        }

        .section {
          margin-bottom: 16px;
        }

        .section h4 {
          margin: 0 0 8px 0;
          color: #00ff00;
          font-size: 14px;
        }

        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-right: 8px;
          margin-bottom: 4px;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-warning {
          background: #ffc107;
          color: black;
        }

        .btn-info {
          background: #17a2b8;
          color: white;
        }

        .btn:hover {
          opacity: 0.8;
        }

        .info {
          font-size: 11px;
          color: #ccc;
          margin-top: 4px;
        }

        .checkbox-group label,
        .radio-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .checkbox-group input,
        .radio-group input {
          margin-right: 6px;
        }

        .slider-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .slider-group input,
        .slider-group select {
          width: 100%;
          margin-top: 4px;
        }

        .actions {
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding-top: 12px;
        }

        .help-panel {
          position: absolute;
          bottom: 20px;
          left: 20px;
          pointer-events: auto;
        }

        .help-item {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
          font-size: 12px;
        }

        .key {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 8px;
          border-radius: 3px;
          margin-right: 8px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          min-width: 60px;
          text-align: center;
        }

        .desc {
          color: white;
          background: rgba(0, 0, 0, 0.6);
          padding: 2px 8px;
          border-radius: 3px;
        }

        .collapsed .panel-content {
          display: none;
        }

        @media (max-width: 768px) {
          .control-panel {
            max-width: 280px;
          }
          
          .fps-display {
            top: 10px;
            right: 10px;
            font-size: 12px;
            padding: 6px 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default UIControls;