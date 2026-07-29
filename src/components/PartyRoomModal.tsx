import React, { useState } from 'react';
import { Users, Copy, Check, FileText, X, Music } from 'lucide-react';
import type { Song } from '../types/ktv';
import { BRAND_LIST } from '../data/brands';
import { AdBannerSlot } from './AdBannerSlot';

interface PartyRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  partySongs: Song[];
  onRemoveSong: (songId: string) => void;
}

// 跨平台安全剪貼簿寫入工具（支援 LINE 內建瀏覽器、HTTP 開發環境與 iOS Safari）
const safeCopyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('[Clipboard] Async write failed, executing fallback:', err);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('[Clipboard] Fallback copy failed:', err);
    return false;
  }
};

export const PartyRoomModal: React.FC<PartyRoomModalProps> = ({
  isOpen,
  onClose,
  partySongs,
  onRemoveSong,
}) => {
  const [roomCode] = useState<string>('KTV-8888');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleShareRoomLink = async () => {
    const text = `🎤 歡唱包廂點歌單 (房間碼: ${roomCode})\n共 ${partySongs.length} 首歌曲，快點擊連結一起加入點歌！\nhttps://ktv-search.tw/room/${roomCode}`;
    const success = await safeCopyToClipboard(text);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      alert('複製失敗，請手動複製文字');
    }
  };

  const handleExportTextPlaylist = async () => {
    let summary = `唱 KTV 點歌清單 (房間碼: ${roomCode})\n==================\n`;
    partySongs.forEach((song, idx) => {
      summary += `${idx + 1}. 《${song.title}》 - ${song.artist}\n`;
      BRAND_LIST.forEach(b => {
        const st = song.brands[b.id];
        if (st && st.available && st.code) {
          summary += `   [${b.shortName}]: ${st.code}\n`;
        }
      });
      summary += `------------------\n`;
    });

    const success = await safeCopyToClipboard(summary);
    if (success) {
      alert('已複製完整點歌碼文字檔！可直接貼至 LINE 群組中對照點歌。');
    } else {
      alert('複製失敗，請手動選擇複製');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'var(--bg-overlay, rgba(15, 23, 42, 0.75))',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '650px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(236, 72, 153, 0.4)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(236, 72, 153, 0.25)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'var(--bg-glass, rgba(255, 255, 255, 0.08))',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Users size={22} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>
              包廂多人點歌本 & 收錄總表
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              朋友掃碼共同編輯歌單 · 統一對照全台各大 KTV 門市收錄狀態
            </p>
          </div>
        </div>

        {/* 📢 廣告位（多人包廂點歌本專用） */}
        <AdBannerSlot slotType="modal" />

        {/* Room Code & Share Banner */}
        <div style={{
          background: 'rgba(236, 72, 153, 0.12)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              目前包廂連線代碼 (Room Code)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f472b6', letterSpacing: '0.05em' }}>
              {roomCode}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleShareRoomLink}
              className="btn-primary"
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedLink ? '已複製房間連結' : '分享點歌房間'}</span>
            </button>

            <button
              onClick={handleExportTextPlaylist}
              className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            >
              <FileText size={16} />
              <span>導出點歌清單</span>
            </button>
          </div>
        </div>

        {/* Party Playlist Songs Count Header */}
        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Music size={16} color="var(--accent-pink)" /> 包廂已點歌曲 ({partySongs.length} 首)：
        </div>

        {/* Songs List */}
        {partySongs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '30px',
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
          }}>
            包廂內尚未點選任何歌曲，請點擊對照表中的歌曲加入！
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {partySongs.map((song, idx) => (
              <div
                key={song.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-glass, rgba(255, 255, 255, 0.04))',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-pink)', fontWeight: 800 }}>
                    #{idx + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {song.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {song.artist} ({song.language})
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveSong(song.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="移出包廂歌單"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
