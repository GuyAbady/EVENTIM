// Shared by server and client (character counter in the admin UI).
// GSM-7 fits 160 chars per SMS (153 when split). Anything outside it, including
// Hebrew, is sent as UCS-2: 70 chars per SMS (67 when split). Providers bill per segment.
const GSM7 = /^[A-Za-z0-9 @£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/;

export function smsSegments(text: string): { chars: number; segments: number; unicode: boolean } {
  const chars = [...text].length;
  const unicode = !GSM7.test(text);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  const segments = chars === 0 ? 0 : chars <= single ? 1 : Math.ceil(chars / multi);
  return { chars, segments, unicode };
}
