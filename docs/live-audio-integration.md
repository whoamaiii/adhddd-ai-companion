# Live Audio Integration Guide

## Overview

The `LiveAudioBodyDouble` component now supports real-time audio interaction with Google's Gemini API through two modes:

1. **Live API Mode** (Primary): Uses Gemini's Live API for real-time audio streaming
2. **Fallback Mode**: Uses Web Speech API + Gemini Chat API + Text-to-Speech

## Implementation Details

### Primary Mode: Gemini Live API

When available, the component uses the Gemini Live API (`client.live.create()`) which supports:
- Real-time bidirectional audio streaming
- Low-latency voice interactions
- Native audio processing
- Interrupt handling

**Audio Format Requirements:**
- Input: 16-bit PCM, 16kHz, mono
- Output: 24kHz audio stream

### Fallback Mode: Web Speech API

If the Live API is not available or fails to initialize, the component automatically falls back to:
1. **Speech Recognition**: Web Speech API for converting speech to text
2. **Text Processing**: Standard Gemini Chat API for generating responses
3. **Speech Synthesis**: Web Speech Synthesis API for text-to-speech output

## Key Changes Made

### 1. Audio Processing (Line 335)
The placeholder at line 335 has been replaced with functional code that:
- Creates WAV blobs from PCM audio data
- Converts audio to base64 format
- Sends audio chunks to Gemini Live API via `session.sendRealtimeInput()`

```typescript
// Create WAV blob from PCM data for Gemini Live API
const audioBlob = createBlob(pcmData, 16000);

// Convert blob to base64 for sending
const reader = new FileReader();
reader.onloadend = async () => {
  if (reader.result && typeof reader.result === 'string') {
    const base64Data = reader.result.split(',')[1];
    
    // Send audio data to Gemini Live API
    if (this.session) {
      await this.session.sendRealtimeInput({
        media: {
          data: base64Data,
          mimeType: 'audio/wav'
        }
      });
    }
  }
};
reader.readAsDataURL(audioBlob);
```

### 2. Session Initialization
Enhanced to detect Live API availability and automatically switch to fallback mode:
- Checks for `client.live` availability
- Handles Live API errors gracefully
- Initializes appropriate fallback services

### 3. Message Processing
Updated to handle both audio and text responses:
- Processes audio data from Live API responses
- Handles text responses for logging/debugging
- Manages audio playback queue

### 4. Fallback Implementation
Complete implementation includes:
- Web Speech Recognition setup with continuous mode
- Gemini chat session for text-based interactions
- Speech synthesis for audio output
- Proper state management between modes

## Usage

### Basic Integration

```html
<gdm-live-audio-body-double 
  api-key="YOUR_GEMINI_API_KEY">
</gdm-live-audio-body-double>
```

### With Custom Styling

```javascript
import './components/LiveAudioBodyDouble';

// The component will automatically handle:
// - API key validation
// - Audio context initialization
// - Mode selection (Live API vs Fallback)
// - Error handling and recovery
```

## API Requirements

### For Live API Mode
- Gemini API key with access to `gemini-2.0-flash-exp` model
- Live API endpoints enabled

### For Fallback Mode
- Gemini API key with access to `gemini-1.5-flash` model
- Browser support for Web Speech API
- Microphone permissions

## Error Handling

The component includes comprehensive error handling:
- API key validation
- Audio context initialization failures
- Network errors
- Permission denials
- Graceful degradation to fallback mode

## Visual States

The component updates its visual state to reflect:
- `idle`: Not recording or processing
- `listening`: Recording audio input
- `processing`: Sending/receiving data
- `speaking`: Playing audio output
- `error`: Error state with message display

## Browser Compatibility

- **Chrome/Edge**: Full support for both modes
- **Firefox**: Fallback mode only (no Web Speech API)
- **Safari**: Limited Web Speech API support
- **Mobile**: Varies by browser and OS

## Testing

To test the implementation:

1. **Live API Mode**: Ensure your API key has access to Gemini Live API
2. **Fallback Mode**: Can be tested by using an API key without Live API access
3. **Error Handling**: Test with invalid API keys, network disconnection, etc.

## Future Enhancements

- Add support for multiple languages
- Implement voice activity detection
- Add audio visualization improvements
- Support for custom voice settings in TTS
- Add transcript display option