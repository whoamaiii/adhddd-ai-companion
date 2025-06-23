# Live Audio Body Double Component

## Overview

The `LiveAudioBodyDouble` component enables real-time voice conversations with Google's Gemini AI. It automatically detects and uses the best available method for audio interaction.

## Quick Start

```html
<script type="module">
  import './components/LiveAudioBodyDouble.js';
</script>

<gdm-live-audio-body-double api-key="YOUR_API_KEY"></gdm-live-audio-body-double>
```

## Features

- **Real-time Audio Streaming**: Uses Gemini Live API when available
- **Automatic Fallback**: Switches to Web Speech API + Gemini Chat when Live API is unavailable
- **Visual Feedback**: 3D visualization shows current state (idle, listening, processing, speaking)
- **Error Recovery**: Handles network issues and API errors gracefully
- **Cross-browser Support**: Works in Chrome, Edge, Safari (with limitations)

## How It Works

### Mode 1: Gemini Live API (Preferred)
When your API key has access to Gemini's Live API:
1. Records audio at 16kHz mono PCM format
2. Streams audio chunks directly to Gemini
3. Receives and plays audio responses at 24kHz
4. Supports interruption and real-time interaction

### Mode 2: Fallback Mode
When Live API is not available:
1. Uses Web Speech Recognition to convert speech to text
2. Sends text to Gemini Chat API
3. Uses Speech Synthesis to speak the response
4. Provides a similar experience with slightly higher latency

## API Key Requirements

### For Live API:
- Access to `gemini-2.0-flash-exp` model
- Live API endpoints enabled
- Higher quota limits recommended

### For Fallback:
- Access to `gemini-1.5-flash` model
- Standard Gemini API access

## Implementation Details

The key enhancement at line 335 now includes:

```typescript
// Process audio chunks and send to Gemini
this.scriptProcessorNode.onaudioprocess = async (audioProcessingEvent) => {
  const pcmData = inputBuffer.getChannelData(0);
  
  // Create WAV blob from PCM data
  const audioBlob = createBlob(pcmData, 16000);
  
  // Convert to base64 and send to Gemini Live API
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64Data = reader.result.split(',')[1];
    await this.session.sendRealtimeInput({
      media: {
        data: base64Data,
        mimeType: 'audio/wav'
      }
    });
  };
  reader.readAsDataURL(audioBlob);
};
```

## Troubleshooting

### "Live API not available"
- Check if your API key has Live API access
- Verify you're using a supported model
- The component will automatically use fallback mode

### "Microphone access denied"
- Grant microphone permissions in browser
- Check if site is served over HTTPS (required for mic access)

### No audio output
- Check browser audio permissions
- Verify speakers/headphones are connected
- Check console for audio decoding errors

## Browser Compatibility

| Browser | Live API | Fallback | Notes |
|---------|----------|----------|-------|
| Chrome  | ✅ | ✅ | Full support |
| Edge    | ✅ | ✅ | Full support |
| Safari  | ✅ | ⚠️  | Limited speech recognition |
| Firefox | ✅ | ❌ | No Web Speech API |

## Events

The component dispatches custom events:

```javascript
audioComponent.addEventListener('status-update', (e) => {
  console.log('Status:', e.detail);
});

audioComponent.addEventListener('error', (e) => {
  console.error('Error:', e.detail);
});
```

## Styling

The component uses CSS custom properties:

```css
gdm-live-audio-body-double {
  --text-primary: #333;
  --text-secondary: #666;
  --bg-card: #fff;
  --border-medium: #ddd;
  --error-color: #f44336;
}
```

## Security Considerations

- API keys should not be hardcoded in production
- Use environment variables or secure key management
- Consider implementing server-side proxy for API calls
- Audio data is transmitted to Google's servers

## Future Enhancements

- [ ] Multi-language support
- [ ] Custom wake words
- [ ] Conversation history
- [ ] Voice selection for TTS
- [ ] Audio level indicators
- [ ] Noise cancellation options