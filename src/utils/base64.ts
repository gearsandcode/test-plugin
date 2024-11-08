export function base64Encode(str: string): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;

  while (i < str.length) {
    const chr1 = str.charCodeAt(i++);
    const chr2 = i < str.length ? str.charCodeAt(i++) : NaN;
    const chr3 = i < str.length ? str.charCodeAt(i++) : NaN;

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      output += chars[enc1] + chars[enc2] + '==';
    } else if (isNaN(chr3)) {
      output += chars[enc1] + chars[enc2] + chars[enc3] + '=';
    } else {
      output += chars[enc1] + chars[enc2] + chars[enc3] + chars[enc4];
    }
  }

  return output;
}
