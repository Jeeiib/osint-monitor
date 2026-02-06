import type { AlertSeverity } from "@/types/alert";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

const SOUND_CONFIG: Record<AlertSeverity, { frequency: number; duration: number; beeps: number }> = {
  medium: { frequency: 440, duration: 0.15, beeps: 1 },
  high: { frequency: 660, duration: 0.15, beeps: 2 },
  critical: { frequency: 880, duration: 0.2, beeps: 3 },
};

function playBeep(ctx: AudioContext, frequency: number, startTime: number, duration: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  // Fade in/out to avoid clicks
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

export function playAlertSound(severity: AlertSeverity): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const config = SOUND_CONFIG[severity];
    const now = ctx.currentTime;

    for (let i = 0; i < config.beeps; i++) {
      playBeep(ctx, config.frequency, now + i * 0.25, config.duration);
    }
  } catch {
    // Audio not available — fail silently
  }
}
