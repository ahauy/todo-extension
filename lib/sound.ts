/**
 * Âm thanh của Học Đường: chuông đồng báo hết phiên, tiếng giấy khẽ khi đóng
 * dấu. Tổng hợp bằng WebAudio nên không cần file âm thanh, không tải mạng.
 * Mặc định TẮT (docs/DESIGN.md § Known Gaps); bật trong Cài đặt hoặc nút chuông
 * trên đầu trang. Mỗi tiếng đều gắn với một việc người dùng nhìn thấy xảy ra.
 */

type Ctor = typeof AudioContext;

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Impl: Ctor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!Impl) return null;
  if (!ctx) {
    try {
      ctx = new Impl();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Tỉ lệ bội âm không nguyên — đặc trưng tiếng chuông đồng */
const BELL_PARTIALS = [1, 2.02, 2.98, 4.16, 5.43];

export function playBell(): void {
  const audio = context();
  if (!audio) return;
  const now = audio.currentTime;
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
  master.connect(audio.destination);

  BELL_PARTIALS.forEach((ratio, index) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = index === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(392 * ratio, now);
    gain.gain.setValueAtTime(0.5 / (index + 1.4), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4 - index * 0.32);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 2.7);
  });
}

/** Tiếng giấy khẽ: một mẩu nhiễu lọc thấp, 90ms */
export function playPaper(): void {
  const audio = context();
  if (!audio) return;
  const now = audio.currentTime;
  const frames = Math.floor(audio.sampleRate * 0.09);
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2100;
  filter.Q.value = 0.8;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start(now);
}

/** Gọi một lần trong thao tác đầu tiên của người dùng để mở khoá audio */
export function unlockAudio(): void {
  context();
}