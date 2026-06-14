/**
 * Hinterlegt den vorkonfigurierten Groq-Zugang in obfuskierter Form, damit er
 * nicht im Klartext im Quellcode/Repository steht. Der Wert ist mit einem
 * einfachen XOR verschleiert und base64-kodiert; er wird erst zur Laufzeit
 * zusammengesetzt.
 *
 * Hinweis: Dies ist Verschleierung, keine echte Geheimhaltung – in jeder Client-
 * App lässt sich ein eingebetteter Zugang theoretisch extrahieren. Bei Missbrauch
 * den Zugang in der Groq-Console einfach neu erstellen.
 */

const TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const PASS = 'gAIn-fitness-2026';

/** Minimaler Base64-Decoder (ohne Abhängigkeit von atob). */
function b64decode(input: string): string {
  const str = input.replace(/=+$/, '');
  let output = '';
  let bc = 0;
  let bs = 0;
  for (let i = 0; i < str.length; i++) {
    const c = TABLE.indexOf(str[i]);
    if (c === -1) continue;
    bs = bc % 4 ? bs * 64 + c : c;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}

/** Setzt den verschleierten Wert zur Laufzeit wieder zusammen. */
function reveal(encoded: string): string {
  const raw = b64decode(encoded);
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    out += String.fromCharCode(raw.charCodeAt(i) ^ PASS.charCodeAt(i % PASS.length));
  }
  return out;
}

const ENCODED = 'ADIiMWM0HBNZLQM5eXgCAH0LcB4/SRQAIykBChEedGlVXBFzMx4YEgsxXDwVOEladFdOVCgwHGA=';

export const GROQ_KEY = reveal(ENCODED);
