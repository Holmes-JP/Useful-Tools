import { useState, useCallback } from 'react';
import { Upload, X, FileSearch, AlertCircle, MapPin, User, Building2, Mail, Smartphone, Copy, CheckCircle2, Info } from 'lucide-react';
import { useMetadataAnalyzer } from '../../../../hooks/useMetadataAnalyzer';
import type { AnalyzedMetadata, TabType } from '../../../../types/metadata';

export default function MetadataAnalyzerPanel() {
    const { analyzedFiles, isAnalyzing, error, analyzeFiles, clearResults, removeFile } = useMetadataAnalyzer();
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [copiedField, setCopiedField] = useState<string>('');

    const selectedFile = analyzedFiles.find(f => f.id === selectedFileId);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        analyzeFiles(files);
    }, [analyzeFiles]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            analyzeFiles(files);
        }
    }, [analyzeFiles]);

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(''), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'high': return 'text-red-400';
            case 'medium': return 'text-yellow-400';
            case 'low': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
            {/* ヘッダー */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="text-xs uppercase tracking-wide text-gray-500">Analyzer</div>
                <h3 className="text-2xl font-bold text-white">Metadata Analyzer</h3>
                <p className="text-sm text-gray-400 mt-1">
                    画像・動画・音声・文書ファイルのメタデータを解析し、プライバシーリスクを可視化
                </p>
            </div>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* ファイル入力エリア */}
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-gray-800/50"
                >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-300 mb-2">ファイルをドラッグ&ドロップ</p>
                    <p className="text-sm text-gray-500 mb-4">または</p>
                    <label className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors">
                        ファイルを選択
                        <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        />
                    </label>
                    <p className="text-xs text-gray-500 mt-4">
                        最大20ファイル、100MB まで対応
                    </p>
                </div>

                {/* エラー表示 */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {/* ローディング表示 */}
                {isAnalyzing && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-blue-300 text-sm">解析中...</p>
                    </div>
                )}

                {/* ファイル一覧 */}
                {analyzedFiles.length > 0 && (
                    <>
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold">解析済みファイル ({analyzedFiles.length})</h4>
                            <button
                                onClick={clearResults}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                            >
                                すべてクリア
                            </button>
                        </div>

                        <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                            <table className="w-full">
                                <thead className="bg-gray-700/50">
                                    <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                                        <th className="px-4 py-3">ファイル名</th>
                                        <th className="px-4 py-3">種別</th>
                                        <th className="px-4 py-3">サイズ</th>
                                        <th className="px-4 py-3">メタデータ</th>
                                        <th className="px-4 py-3">プライバシーリスク</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/50">
                                    {analyzedFiles.map(file => (
                                        <tr
                                            key={file.id}
                                            onClick={() => {
                                                setSelectedFileId(file.id);
                                                setActiveTab('overview');
                                            }}
                                            className={`cursor-pointer transition-colors ${
                                                selectedFileId === file.id ? 'bg-blue-500/10' : 'hover:bg-gray-700/30'
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-sm">{file.fileName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{file.fileType}</td>
                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{file.metadataCount} 項目</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-medium ${getRiskColor(file.privacyRisk)}`}>
                                                        {file.privacyRisk === 'high' ? '高' : file.privacyRisk === 'medium' ? '中' : '低'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        ({file.privacyRiskReason})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(file.id);
                                                        if (selectedFileId === file.id) {
                                                            setSelectedFileId(null);
                                                        }
                                                    }}
                                                    className="p-1 hover:bg-gray-600 rounded transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* 詳細パネル */}
                {selectedFile && (
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                        {/* タブヘッダー */}
                        <div className="flex border-b border-gray-700 overflow-x-auto">
                            {(['overview', 'technical', 'tags', 'location', 'timeline', 'raw'] as TabType[]).map(tab => {
                                const isDisabled = tab === 'location' && !selectedFile.gpsInfo;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => !isDisabled && setActiveTab(tab)}
                                        disabled={isDisabled}
                                        className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                                            activeTab === tab
                                                ? 'text-blue-400 border-b-2 border-blue-400'
                                                : isDisabled
                                                ? 'text-gray-600 cursor-not-allowed'
                                                : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                    >
                                        {tab === 'overview' && 'Overview'}
                                        {tab === 'technical' && 'Technical'}
                                        {tab === 'tags' && 'EXIF / Tags'}
                                        {tab === 'location' && 'Location'}
                                        {tab === 'timeline' && 'Timeline'}
                                        {tab === 'raw' && 'Raw'}
                                    </button>
                                );
                            })}
                        </div>

                        {/* タブコンテンツ */}
                        <div className="p-6">
                            {activeTab === 'overview' && <OverviewTab file={selectedFile} copyToClipboard={copyToClipboard} copiedField={copiedField} />}
                            {activeTab === 'technical' && <TechnicalTab file={selectedFile} />}
                            {activeTab === 'tags' && <TagsTab file={selectedFile} copyToClipboard={copyToClipboard} copiedField={copiedField} />}
                            {activeTab === 'location' && selectedFile.gpsInfo && <LocationTab file={selectedFile} copyToClipboard={copyToClipboard} copiedField={copiedField} />}
                            {activeTab === 'timeline' && <TimelineTab file={selectedFile} />}
                            {activeTab === 'raw' && <RawTab file={selectedFile} copyToClipboard={copyToClipboard} copiedField={copiedField} />}
                        </div>
                    </div>
                )}

                {/* フッター */}
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-400">
                        アップロードされたファイルはブラウザ内でのみ解析され、サーバーには送信されません。
                    </p>
                </div>
            </div>
        </div>
    );
}

// Overview タブ
function OverviewTab({ file, copyToClipboard, copiedField }: { file: AnalyzedMetadata; copyToClipboard: (text: string, field: string) => void; copiedField: string }) {
    return (
        <div className="space-y-6">
            {/* 基本情報 */}
            <div>
                <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">基本情報</h5>
                <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="ファイル名" value={file.fileName} />
                    <InfoRow label="ファイル種別" value={file.fileType} />
                    <InfoRow label="ファイルサイズ" value={`${(file.fileSize / 1024 / 1024).toFixed(2)} MB`} />
                    <InfoRow label="メタデータ総数" value={`${file.metadataCount} 項目`} />
                    {file.technicalInfo.width && file.technicalInfo.height && (
                        <InfoRow label="解像度" value={`${file.technicalInfo.width} × ${file.technicalInfo.height} px`} />
                    )}
                    {file.technicalInfo.aspectRatio && (
                        <InfoRow label="アスペクト比" value={file.technicalInfo.aspectRatio} />
                    )}
                    {file.technicalInfo.duration && (
                        <InfoRow label="再生時間" value={`${file.technicalInfo.duration.toFixed(1)} 秒`} />
                    )}
                </div>
            </div>

            {/* プライバシー関連情報 */}
            <div>
                <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">プライバシー関連情報</h5>
                <div className="bg-gray-700/30 rounded-lg p-4 space-y-3">
                    <PrivacyItem
                        icon={<MapPin className="w-4 h-4" />}
                        label="位置情報"
                        present={file.privacyInfo.hasLocation}
                        details={file.privacyInfo.hasLocation ? 'GPS タグが含まれています' : 'なし'}
                    />
                    <PrivacyItem
                        icon={<User className="w-4 h-4" />}
                        label="人名"
                        present={file.privacyInfo.hasPersonName}
                        details={file.privacyInfo.personNames.join(', ') || 'なし'}
                        copyable={file.privacyInfo.personNames.join(', ')}
                        onCopy={(text) => copyToClipboard(text, 'person')}
                        copied={copiedField === 'person'}
                    />
                    <PrivacyItem
                        icon={<Building2 className="w-4 h-4" />}
                        label="会社名"
                        present={file.privacyInfo.hasCompanyName}
                        details={file.privacyInfo.companyNames.join(', ') || 'なし'}
                        copyable={file.privacyInfo.companyNames.join(', ')}
                        onCopy={(text) => copyToClipboard(text, 'company')}
                        copied={copiedField === 'company'}
                    />
                    <PrivacyItem
                        icon={<Mail className="w-4 h-4" />}
                        label="メールアドレス"
                        present={file.privacyInfo.hasEmail}
                        details={file.privacyInfo.emails.join(', ') || 'なし'}
                        copyable={file.privacyInfo.emails.join(', ')}
                        onCopy={(text) => copyToClipboard(text, 'email')}
                        copied={copiedField === 'email'}
                    />
                    <PrivacyItem
                        icon={<Smartphone className="w-4 h-4" />}
                        label="デバイス情報"
                        present={file.privacyInfo.deviceInfo.length > 0}
                        details={file.privacyInfo.deviceInfo.join(', ') || 'なし'}
                    />
                    <PrivacyItem
                        icon={<FileSearch className="w-4 h-4" />}
                        label="使用ソフトウェア"
                        present={file.privacyInfo.hasSoftwareInfo}
                        details={file.privacyInfo.softwareInfo.join(', ') || 'なし'}
                    />
                </div>
            </div>
        </div>
    );
}

// Technical タブ
function TechnicalTab({ file }: { file: AnalyzedMetadata }) {
    return (
        <div className="space-y-4">
            <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">技術情報</h5>
            <div className="grid grid-cols-2 gap-4">
                {file.technicalInfo.width && <InfoRow label="幅" value={`${file.technicalInfo.width} px`} />}
                {file.technicalInfo.height && <InfoRow label="高さ" value={`${file.technicalInfo.height} px`} />}
                {file.technicalInfo.bitDepth && <InfoRow label="ビット深度" value={`${file.technicalInfo.bitDepth} bit`} />}
                {file.technicalInfo.colorSpace && <InfoRow label="カラースペース" value={file.technicalInfo.colorSpace} />}
                {file.technicalInfo.compression && <InfoRow label="圧縮方式" value={file.technicalInfo.compression} />}
                {file.technicalInfo.videoCodec && <InfoRow label="Video Codec" value={file.technicalInfo.videoCodec} />}
                {file.technicalInfo.audioCodec && <InfoRow label="Audio Codec" value={file.technicalInfo.audioCodec} />}
                {file.technicalInfo.frameRate && <InfoRow label="フレームレート" value={`${file.technicalInfo.frameRate} fps`} />}
                {file.technicalInfo.sampleRate && <InfoRow label="サンプルレート" value={`${file.technicalInfo.sampleRate} Hz`} />}
                {file.technicalInfo.channels && <InfoRow label="チャンネル" value={`${file.technicalInfo.channels}`} />}
                {file.technicalInfo.bitrate && <InfoRow label="ビットレート" value={`${file.technicalInfo.bitrate} kbps`} />}
                {file.technicalInfo.pdfVersion && <InfoRow label="PDFバージョン" value={file.technicalInfo.pdfVersion} />}
                {file.technicalInfo.producer && <InfoRow label="Producer" value={file.technicalInfo.producer} />}
                {file.technicalInfo.creator && <InfoRow label="Creator" value={file.technicalInfo.creator} />}
                {file.technicalInfo.pageCount && <InfoRow label="ページ数" value={`${file.technicalInfo.pageCount}`} />}
            </div>
            {Object.keys(file.technicalInfo).length === 0 && (
                <p className="text-gray-500 text-sm">技術情報は検出されませんでした。</p>
            )}
        </div>
    );
}

// Tags タブ
function TagsTab({ file, copyToClipboard, copiedField }: { file: AnalyzedMetadata; copyToClipboard: (text: string, field: string) => void; copiedField: string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const filteredFields = file.fields.filter(field => {
        const matchesSearch = searchTerm === '' || 
            field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            field.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(field.value).toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = categoryFilter === 'all' || field.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...Array.from(new Set(file.fields.map(f => f.category)))];

    return (
        <div className="space-y-4">
            {/* フィルター */}
            <div className="flex gap-4">
                <input
                    type="text"
                    placeholder="検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>
                            {cat === 'all' ? 'すべて' : cat}
                        </option>
                    ))}
                </select>
            </div>

            {/* テーブル */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-700/50">
                        <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                            <th className="px-4 py-3">カテゴリ</th>
                            <th className="px-4 py-3">項目名</th>
                            <th className="px-4 py-3">キー名</th>
                            <th className="px-4 py-3">値</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {filteredFields.map((field, idx) => (
                            <tr key={idx} className={field.isPrivacySensitive ? 'bg-red-500/5' : ''}>
                                <td className="px-4 py-3 text-sm">
                                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">{field.category}</span>
                                </td>
                                <td className="px-4 py-3 text-sm">{field.label}</td>
                                <td className="px-4 py-3 text-sm font-mono text-gray-400">{field.key}</td>
                                <td className="px-4 py-3 text-sm">{String(field.value)}</td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => copyToClipboard(String(field.value), `field-${idx}`)}
                                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                                    >
                                        {copiedField === `field-${idx}` ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredFields.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">該当するメタデータが見つかりませんでした。</p>
            )}
        </div>
    );
}

// Location タブ
function LocationTab({ file, copyToClipboard, copiedField }: { file: AnalyzedMetadata; copyToClipboard: (text: string, field: string) => void; copiedField: string }) {
    const gps = file.gpsInfo;
    if (!gps) return null;

    const mapsUrl = gps.latitude && gps.longitude 
        ? `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`
        : '';

    return (
        <div className="space-y-6">
            {/* 警告 */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-red-300 font-medium">このファイルには撮影場所などの位置情報が含まれています。</p>
                    <p className="text-red-300/70 text-sm mt-1">外部に共有する際はご注意ください。</p>
                </div>
            </div>

            {/* GPS情報 */}
            <div className="grid grid-cols-2 gap-4">
                {gps.latitude !== undefined && (
                    <InfoRow 
                        label="緯度 (Decimal)" 
                        value={`${gps.latitude.toFixed(6)}° ${gps.latitudeRef || ''}`}
                        copyable={String(gps.latitude)}
                        onCopy={() => copyToClipboard(String(gps.latitude), 'lat')}
                        copied={copiedField === 'lat'}
                    />
                )}
                {gps.longitude !== undefined && (
                    <InfoRow 
                        label="経度 (Decimal)" 
                        value={`${gps.longitude.toFixed(6)}° ${gps.longitudeRef || ''}`}
                        copyable={String(gps.longitude)}
                        onCopy={() => copyToClipboard(String(gps.longitude), 'lon')}
                        copied={copiedField === 'lon'}
                    />
                )}
                {gps.latitudeDMS && <InfoRow label="緯度 (DMS)" value={gps.latitudeDMS} />}
                {gps.longitudeDMS && <InfoRow label="経度 (DMS)" value={gps.longitudeDMS} />}
                {gps.altitude !== undefined && <InfoRow label="高度" value={`${gps.altitude} m`} />}
            </div>

            {/* 地図リンク */}
            {mapsUrl && (
                <div>
                    <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">地図で表示</h5>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={mapsUrl}
                            readOnly
                            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                        />
                        <button
                            onClick={() => copyToClipboard(mapsUrl, 'maps')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                            {copiedField === 'maps' ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-sm">コピー済み</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span className="text-sm">コピー</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Timeline タブ
function TimelineTab({ file }: { file: AnalyzedMetadata }) {
    return (
        <div className="space-y-4">
            <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">日時情報</h5>
            
            {file.dateTimes.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
                            <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                                <th className="px-4 py-3">種類</th>
                                <th className="px-4 py-3">UTC</th>
                                <th className="px-4 py-3">ローカル時刻</th>
                                <th className="px-4 py-3">ソースフィールド</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {file.dateTimes.map((dt, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3 text-sm font-medium">{dt.type}</td>
                                    <td className="px-4 py-3 text-sm text-gray-400 font-mono">{dt.valueUTC}</td>
                                    <td className="px-4 py-3 text-sm">{dt.valueLocal}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">{dt.sourceField}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500 text-sm">日時情報は検出されませんでした。</p>
            )}
        </div>
    );
}

// Raw タブ
function RawTab({ file, copyToClipboard, copiedField }: { file: AnalyzedMetadata; copyToClipboard: (text: string, field: string) => void; copiedField: string }) {
    const jsonString = JSON.stringify(file.rawMetadata, null, 2);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">生メタデータ (JSON)</h5>
                <button
                    onClick={() => copyToClipboard(jsonString, 'json')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                >
                    {copiedField === 'json' ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm">コピー済み</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            <span className="text-sm">Copy JSON</span>
                        </>
                    )}
                </button>
            </div>
            
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs overflow-x-auto text-gray-300 font-mono max-h-96 overflow-y-auto">
                {jsonString}
            </pre>
        </div>
    );
}

// ヘルパーコンポーネント

function InfoRow({ label, value, copyable, onCopy, copied }: { 
    label: string; 
    value: string; 
    copyable?: string;
    onCopy?: () => void;
    copied?: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <div className="text-xs text-gray-500">{label}</div>
                <div className="text-sm text-white mt-0.5">{value}</div>
            </div>
            {copyable && onCopy && (
                <button
                    onClick={onCopy}
                    className="p-1 hover:bg-gray-600 rounded transition-colors ml-2"
                >
                    {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </button>
            )}
        </div>
    );
}

function PrivacyItem({ 
    icon, 
    label, 
    present, 
    details, 
    copyable, 
    onCopy, 
    copied 
}: { 
    icon: React.ReactNode; 
    label: string; 
    present: boolean; 
    details: string;
    copyable?: string;
    onCopy?: (text: string) => void;
    copied?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
                <div className={`mt-0.5 ${present ? 'text-yellow-400' : 'text-gray-600'}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium">{label}</div>
                    <div className={`text-xs mt-0.5 ${present ? 'text-gray-300' : 'text-gray-500'}`}>
                        {details}
                    </div>
                </div>
            </div>
            {copyable && onCopy && present && (
                <button
                    onClick={() => onCopy(copyable)}
                    className="p-1 hover:bg-gray-600 rounded transition-colors"
                >
                    {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </button>
            )}
        </div>
    );
}
