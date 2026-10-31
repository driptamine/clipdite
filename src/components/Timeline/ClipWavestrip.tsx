import { useEffect, useState } from 'react';
import { getWaveform, peaksForRange } from '../../utils/waveform';
import type { MediaItem, TimelineClip } from '../../types';

interface Props {
  media: MediaItem;
  clip: TimelineClip;
  fps: number;
}

/** Waveform bars of this exact clip segment, under the title strip. */
export default function ClipWavestrip({ media, clip, fps }: Props) {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    let alive = true;
    if (!media.url) return;
    getWaveform(media.id, media.url).then((all) => {
      if (!alive) return;
      setBars(peaksForRange(all, media.duration, clip.inPoint, clip.outPoint, fps));
    });
    return () => {
      alive = false;
    };
  }, [media.id, media.url, media.duration, clip.inPoint, clip.outPoint, fps]);

  if (bars.length === 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 15,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '0 4px',
        overflow: 'hidden',
      }}
    >
      {bars.map((v, i) => (
        <div
          key={i}
          style={{
            flex: '1 1 0',
            minWidth: 1,
            height: `${Math.max(6, Math.round(v * 100))}%`,
            background: 'rgba(255, 255, 255, 0.75)',
            borderRadius: 1,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
