# WeV - バーチャル配信補助アプリ

WeV（ウェブイ）は、ブラウザ上で動作するフリーのバーチャル配信補助アプリです。VRMアバターを表示し、カメラフェイストラッキングで表情をリアルタイム反映、OBS等に直接取り込み可能な出力を提供します。

## 🌟 特徴

- **VRMアバター対応**: @pixiv/three-vrmを使用したVRMモデル表示
- **リアルタイムフェイストラッキング**: MediaPipe Face Meshによる表情検出
- **OBS連携**: Green Backgroundによる直接取り込み対応
- **軽量設計**: クライアント負荷を抑えた最適化済み
- **音声リップシンク**: Web Audio APIベースの簡易リップシンク
- **完全ブラウザ完結**: サーバー不要のクライアント専用アプリ

## 🚀 使用方法

### アクセス
[WeV App](https://rikuriku-1.github.io/WeV-App/) にアクセス

### 基本操作
- **SPACEキー**: UI表示/非表示切り替え
- **Show Camera**: フェイストラッキング用カメラ表示切り替え
- **Load VRM File**: 独自のVRMモデルを読み込み

### OBS設定
1. OBSで「ブラウザ」ソースを追加
2. URL: `https://rikuriku-1.github.io/WeV-App/`
3. 幅: 1920, 高さ: 1080
4. SPACEキーでUI非表示にしてクリーンな映像を取得

## 🔧 技術仕様

### フロントエンド
- **Framework**: React 18 + TypeScript + Vite
- **3D Engine**: Three.js + @pixiv/three-vrm
- **Face Tracking**: MediaPipe Face Mesh + Kalidokit
- **Performance**: Stats.js によるFPS監視

### 軽量化対策
- レンダリング: アンチエイリアス無効、シャドウマップ無効
- トラッキング: 低解像度モード (640x480)、フレーム間引き処理
- モデル: 裏面カリング、テクスチャ解像度制限
- 音声: 簡易音量ベースViseme (FFT解析無し)

### ブラウザ要件
- モダンブラウザ (Chrome 88+, Firefox 85+, Safari 14+)
- HTTPS環境 (カメラアクセスのため)
- WebGL 2.0 対応

## 🏗️ 開発・ビルド

### 開発環境セットアップ
```bash
cd wev
npm install
npm run dev
```

### プロダクションビルド
```bash
cd wev
npm run build
```

### ローカルプレビュー
```bash
cd wev
npm run preview
```

## 📁 プロジェクト構造

```
wev/
├── public/
│   └── models/          # VRMファイル配置用
├── src/
│   ├── components/      # React コンポーネント
│   │   ├── AvatarCanvas.tsx
│   │   ├── FaceTrackingCanvas.tsx
│   │   └── UIControls.tsx
│   ├── hooks/          # カスタムフック
│   │   ├── useFaceTracking.ts
│   │   └── useAudioLipSync.ts
│   └── utils/          # ユーティリティ
├── package.json
└── vite.config.ts
```

## 🎯 MVPチェックリスト

- ✅ カメラ取得 → MediaPipe Face Mesh でランドマーク取得
- ✅ VRM読み込み → Three.jsで表示（@pixiv/three-vrm）
- ✅ BlendShape反映 → 表情がVRMに反映
- ✅ UI表示/非表示切替 → Spaceキーで切替
- ✅ 背景は Green Background のみ
- ✅ モデル軽量化・テクスチャ解像度削減・フレームレート制限・裏面カリング実施
- ✅ トラッキング低解像度・間引き処理で負荷軽減
- ✅ 音声リップシンクは簡易音量ベースで軽量化
- ✅ UI表示時にFPS表示

## 🔒 プライバシー・セキュリティ

- **ローカル処理**: カメラ映像・音声はブラウザ内でのみ処理
- **外部送信なし**: トラッキングデータや映像の外部送信は一切なし
- **HTTPS必須**: セキュアな環境でのみ動作
- **透明性**: 全処理内容をオープンソースで公開

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストやイシューを歓迎します。軽量化・最適化・機能追加のご提案をお待ちしています。

## 🔮 今後の予定

- より高精度なVRM BlendShape対応
- ハンドトラッキング対応
- カスタム背景色設定
- VRM Springbone対応
- パフォーマンス分析ツール