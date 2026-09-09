import type { KeyboardEvent } from 'react';

// Enterキー押下時の制御のためキーボードからデバイスを判定
const isTouchDevice = window.matchMedia(
  '(hover: none) and (pointer: coarse)',
).matches;

function isSendKeyEvent(event: KeyboardEvent): boolean {
  if (isTouchDevice || event.key !== 'Enter' || event.shiftKey) {
    return false;
  }

  return !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229;
}

export { isTouchDevice, isSendKeyEvent };
