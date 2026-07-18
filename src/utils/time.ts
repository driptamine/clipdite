export function frameToTimecode(frame: number, fps: number): string {
  const totalSeconds = frame / fps;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = frame % fps;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
    frames.toString().padStart(2, '0'),
  ].join(':');
}

export function timecodeToFrame(timecode: string, fps: number): number {
  const parts = timecode.split(':').map(Number);
  if (parts.length !== 4) return 0;
  const [hours, minutes, seconds, frames] = parts;
  return hours * 3600 * fps + minutes * 60 * fps + seconds * fps + frames;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateColor(index: number): string {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
    '#6366f1', '#14b8a6', '#eab308', '#dc2626',
  ];
  return colors[index % colors.length];
}
