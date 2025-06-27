// Utility functions for audio processing

/**
 * Decodes a base64 string to a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns The decoded Uint8Array.
 */
export function decode(base64: string): Uint8Array {
  try {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Failed to decode base64 string:", e);
    return new Uint8Array(0);
  }
}

/**
 * Decodes raw audio data (e.g., PCM) into an AudioBuffer.
 * This is a simplified version. Real PCM decoding might be more complex
 * or the model might return a directly decodable format like WAV.
 * @param data The raw audio data as Uint8Array.
 * @param context The AudioContext.
 * @param targetSampleRate The target sample rate for the AudioBuffer.
 * @param channels The number of channels.
 * @returns A Promise resolving to an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  context: AudioContext,
  targetSampleRate: number, // Typically the sample rate of the AudioContext
  channels: number = 1
): Promise<AudioBuffer> {
   // Assuming the incoming data is a WAV file or similar that decodeAudioData can handle
   // If it's raw PCM, more work is needed here.
  try {
    const audioBuffer = await context.decodeAudioData(data.buffer.slice(0)); // Create a new ArrayBuffer slice
    
    // Resample if necessary (simplified)
    if (audioBuffer.sampleRate !== targetSampleRate) {
        console.warn(`Resampling from ${audioBuffer.sampleRate} to ${targetSampleRate}. This is a placeholder for actual resampling logic.`);
        // For true resampling, you'd need a library or manual implementation.
        // This is a common point of complexity. For now, we'll use the decoded buffer as is.
        // A more robust solution might involve OfflineAudioContext for resampling.
    }
    return audioBuffer;

  } catch (e) {
      console.error("Error decoding audio data:", e);
      // Return a very short silent buffer as a fallback to prevent total failure
      return context.createBuffer(channels, 1, targetSampleRate);
  }
}


/**
 * Creates a Blob from Float32Array PCM data.
 * This might be used if the API expects audio data in Blob format (e.g., WAV).
 * @param pcmData The Float32Array containing PCM data.
 * @param sampleRate The sample rate of the PCM data.
 * @returns A Blob, typically a WAV file.
 */
export function createBlob(pcmData: Float32Array, sampleRate: number = 16000): Blob {
  // Simple WAV header creation
  const channels = 1; // Mono
  const bitDepth = 16;
  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length * 2, true);
  writeString(view, 8, 'WAVE');
  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * (bitDepth / 8), true); // ByteRate
  view.setUint16(32, channels * (bitDepth / 8), true); // BlockAlign
  view.setUint16(34, bitDepth, true);
  // DATA sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length * 2, true);

  // Write PCM samples
  floatTo16BitPCM(view, 44, pcmData);

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

/**
 * Extracts the main part of a task text, typically before an "@" symbol.
 * Also trims whitespace.
 * @param {string | undefined} taskText The full task text.
 * @returns {string} The processed task text, or an empty string if input is undefined or null.
 */
export function getDisplayTaskText(taskText: string | undefined): string {
  if (!taskText) {
    return "";
  }
  return taskText.split('@')[0].trim();
}
