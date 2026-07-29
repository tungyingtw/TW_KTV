import React, { useState } from 'react';
import type { Song, BrandId } from '../types/ktv';
import { BRAND_LIST } from '../data/brands';
import { X, Users, Copy, Share2, Check, Music } from 'lucide-react';
import { AdBannerSlot } from './AdBannerSlot';

interface PartyRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  partySongs: Song[];
  onCopyCode: (code: string, brandName: string, songTitle: string) => void;
  selectedBrand?: BrandId | 'all';
}

export const PartyRoomModal: React.FC<PartyRoomModalProps> = ({
  isOpen,
  onClose,
  partySongs,
  onCopyCode,
}) => {
  const [roomCode] = useState<string>('KTV-8888');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleShareRoomLink = () => {
    const text = `🎤 歡唱包廂點歌單 (房間碼: ${roomCode})\n共 ${partySongs.length} 首歌曲，快點擊連結一起加入點歌！\nhttps://ktv-search.tw/room/${roomCode}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleExportTextPlaylist = () => {
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

    navigator.clipboard.writeText(summary);
    alert('已複製完整點歌碼文字檔！可直接貼至 LINE 群組中對照點歌。');
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
            background: 'rgba(255, 255, 255, 0.08)',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
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
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copiedLink ? '已複製包廂連結' : '分享 LINE 包廂連結'}</span>
            </button>

            <button
              onClick={handleExportTextPlaylist}
              className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            >
              <Copy size={16} />
              <span>導出點歌清單</span>
            </button>
          </div>
        </div>

        {/* Playlist Items */}
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Music size={16} color="var(--accent-pink)" /> 包廂已點歌曲 ({partySongs.length} 首)：
        </h4>

        {partySongs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '30px',
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
          }}>
            <p>包廂歌本目前沒有歌曲，快在搜尋列點擊愛心新增歌曲吧！</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {partySongs.map((song, idx) => (
              <div
                key={song.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>
                    {idx + 1}. 《{song.title}》
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-pink)', marginLeft: '8px', fontWeight: 600 }}>
                      {song.artist}
                    </span>
                  </div>
                  <span className="badge badge-original-vocal" style={{ fontSize: '0.68rem' }}>
                    {song.language}
                  </span>
                </div>

                {/* KTV Brand Song Codes Row */}
                <div style={{
                  marginTop: '10px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}>
                  {BRAND_LIST.map(b => {
                    const status = song.brands[b.id];
                    if (!status || !status.available || !status.code) return null;

                    return (
                      <button
                        key={b.id}
                        onClick={() => onCopyCode(status.code!, b.shortName, song.title)}
                        className="btn-copy"
                        style={{
                          fontSize: '0.78rem',
                          background: b.badgeBg,
                          borderColor: `${b.color}44`,
                          color: b.color,
                        }}
                      >
                        <span>{b.shortName}: <strong>{status.code}</strong></span>
                        <Copy size={11} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
