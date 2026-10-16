// Shared capture lock: guide audio and effects stay silent during recognition.
let capturing = false;
const listeners = new Set<(value: boolean) => void>();
export const audioGate = {
  isCapturing: () => capturing,
  setCapturing: (value: boolean) => {
    capturing = value;
    listeners.forEach((listener) => listener(value));
  },
  subscribe: (listener: (value: boolean) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
