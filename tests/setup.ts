import '@testing-library/jest-dom';

// Web Speech API Mock for jsdom test environment
class MockSpeechSynthesisUtterance {
  text: string;
  lang = 'id-ID';
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: ((ev: Event) => void) | null = null;
  onend: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  constructor(text = '') {
    this.text = text;
  }
}

const mockVoices: SpeechSynthesisVoice[] = [
  {
    default: true,
    lang: 'id-ID',
    localService: true,
    name: 'Indonesian Voice',
    voiceURI: 'id-ID',
  },
];

const mockSpeechSynthesis = {
  pending: false,
  speaking: false,
  paused: false,
  onvoiceschanged: null,
  getVoices: () => mockVoices,
  speak: (utterance: MockSpeechSynthesisUtterance) => {
    mockSpeechSynthesis.speaking = true;
    utterance.onstart?.(new Event('start'));
    setTimeout(() => {
      mockSpeechSynthesis.speaking = false;
      utterance.onend?.(new Event('end'));
    }, 10);
  },
  cancel: () => {
    mockSpeechSynthesis.speaking = false;
  },
  pause: () => {},
  resume: () => {},
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSpeechSynthesis,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: MockSpeechSynthesisUtterance,
    writable: true,
    configurable: true,
  });

  window.Audio = class {
    src = '';
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    play() {
      setTimeout(() => {
        this.onended?.();
      }, 10);
      return Promise.resolve();
    }
    pause() {}
  } as unknown as typeof Audio;
}
