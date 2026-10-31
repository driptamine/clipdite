export interface ProbedMedia {
  duration: number;
  width?: number;
  height?: number;
  hasAudio: boolean;
}

/**
 * Read duration / dimensions of an uploaded file with MediaBunny
 * (lazy-loaded so the main bundle stays lean).
 * Falls back to a temporary <video>/<audio> element when MediaBunny
 * cannot parse the container.
 */
export async function probeMediaFile(file: Blob): Promise<ProbedMedia> {
  try {
    const { Input, BlobSource, ALL_FORMATS } = await import('mediabunny');
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    });
    const [duration, videoTracks, audioTracks] = await Promise.all([
      input.computeDuration(),
      input.getVideoTracks(),
      input.getAudioTracks(),
    ]);
    const first = videoTracks[0];
    const probed: ProbedMedia = {
      duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
      width: first?.displayWidth,
      height: first?.displayHeight,
      hasAudio: audioTracks.length > 0,
    };
    input.dispose();
    if (probed.duration > 0) return probed;
  } catch {
    // fall through to the element-based probe below
  }
  return probeWithElement(file);
}

function probeWithElement(file: Blob): Promise<ProbedMedia> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const isVideo = (file.type || '').startsWith('video/');
    const el = document.createElement(isVideo ? 'video' : 'audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      const out: ProbedMedia = {
        duration: Number.isFinite(el.duration) ? el.duration : 5,
        // Element fallback can't detect streams: assume sound for AV media.
        hasAudio: true,
      };
      if (isVideo) {
        const v = el as HTMLVideoElement;
        out.width = v.videoWidth || undefined;
        out.height = v.videoHeight || undefined;
      }
      URL.revokeObjectURL(url);
      resolve(out);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ duration: 5, hasAudio: false });
    };
    el.src = url;
  });
}
