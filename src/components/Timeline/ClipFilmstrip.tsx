import { useEffect, useState } from 'react';
import { getFilmstrip, stripForRange } from '../../utils/filmstrip';
import type { MediaItem, TimelineClip } from '../../types';

interface Props {
  media: MediaItem;
  clip: TimelineClip;
  fps: number;
}

/** Frames of this exact clip segment, stretched across the clip body. */
export default function ClipFilmstrip({ media, clip, fps }: Props) {
  const [thumbs, setThumbs] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    if (!media.url) return;
    getFilmstrip(media.id, media.url, media.duration).then((all) => {
      if (!alive) return;
      setThumbs(stripForRange(all, media.duration, clip.inPoint, clip.outPoint, fps));
    });
    return () => {
      alive = false;
    };
  }, [media.id, media.url, media.duration, clip.inPoint, clip.outPoint, fps]);

  if (thumbs.length === 0) return null;
  return (
    // Starts below the 15px ClipTitle — no frames hide under the header.
    <div style={{ position: 'absolute', top: 15, left: 0, right: 0, bottom: 0, display: 'flex', overflow: 'hidden' }}>
      {thumbs.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          draggable={false}
          style={{ flex: '1 1 0', minWidth: 0, height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
        />
      ))}
    </div>
  );
}
