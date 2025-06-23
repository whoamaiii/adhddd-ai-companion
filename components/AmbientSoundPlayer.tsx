import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AmbientSoundPlayerProps {
  isActive?: boolean;
  defaultVolume?: number;
  defaultSoundType?: SoundType;
  onVolumeChange?: (volume: number) => void;
  onSoundTypeChange?: (soundType: SoundType) => void;
}

type SoundType = 'white' | 'pink' | 'brown' | 'rain' | 'ocean';

interface SoundOption {
  id: SoundType;
  label: string;
  description: string;
}

const soundOptions: SoundOption[] = [
  { id: 'white', label: 'White Noise', description: 'Equal energy across frequencies' },
  { id: 'pink', label: 'Pink Noise', description: 'Softer, more natural sound' },
  { id: 'brown', label: 'Brown Noise', description: 'Deep, rumbling sound' },
  { id: 'rain', label: 'Rain', description: 'Gentle rainfall' },
  { id: 'ocean', label: 'Ocean Waves', description: 'Calming ocean sounds' },
];

export const AmbientSoundPlayer: React.FC<AmbientSoundPlayerProps> = ({
  isActive = false,
  defaultVolume = 30,
  defaultSoundType = 'white',
  onVolumeChange,
  onSoundTypeChange,
}) => {
  const [volume, setVolume] = useState(defaultVolume);
  const [soundType, setSoundType] = useState<SoundType>(defaultSoundType);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const lfoNodeRef = useRef<OscillatorNode | null>(null);
  const lfoGainNodeRef = useRef<GainNode | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle isActive prop changes
  useEffect(() => {
    if (isActive && !isPlaying) {
      startSound();
    } else if (!isActive && isPlaying) {
      stopSound();
    }
  }, [isActive, soundType]);

  // Handle volume changes
  useEffect(() => {
    if (gainNodeRef.current && isPlaying) {
      gainNodeRef.current.gain.setValueAtTime(volume / 100, audioContextRef.current!.currentTime);
    }
  }, [volume, isPlaying]);

  const createNoiseBuffer = (context: AudioContext, type: SoundType): AudioBuffer => {
    const bufferSize = 2 * context.sampleRate; // 2 seconds of noise
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      // White noise: random values
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      // Pink noise: approximation using multiple white noise sources
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      // Brown noise: integrated white noise
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Amplify
      }
    } else if (type === 'rain') {
      // Rain: filtered noise with random drops
      for (let i = 0; i < bufferSize; i++) {
        // Base rain sound (filtered noise)
        output[i] = (Math.random() * 2 - 1) * 0.1;
        
        // Add random "drops"
        if (Math.random() < 0.001) {
          output[i] += (Math.random() * 2 - 1) * 0.3;
        }
      }
    } else if (type === 'ocean') {
      // Ocean: low-frequency modulated noise
      const waveFreq = 0.08;
      for (let i = 0; i < bufferSize; i++) {
        const envelope = (Math.sin(2 * Math.PI * waveFreq * i / context.sampleRate) + 1) / 2;
        output[i] = (Math.random() * 2 - 1) * envelope * 0.3;
      }
    }

    return buffer;
  };

  const startSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const context = audioContextRef.current;
    
    // Create nodes
    const buffer = createNoiseBuffer(context, soundType);
    const noiseNode = context.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;
    
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, context.currentTime);
    
    // Connect nodes
    noiseNode.connect(gainNode);

    // Apply filters for rain and ocean sounds
    if (soundType === 'rain') {
      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(400, context.currentTime);
      filter.Q.setValueAtTime(1, context.currentTime);
      
      noiseNode.connect(filter);
      filter.connect(gainNode);
      filterNodeRef.current = filter;
    } else if (soundType === 'ocean') {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, context.currentTime);
      filter.Q.setValueAtTime(1, context.currentTime);
      
      // Create LFO for ocean wave effect
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.frequency.setValueAtTime(0.08, context.currentTime);
      lfoGain.gain.setValueAtTime(200, context.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      
      noiseNode.connect(filter);
      filter.connect(gainNode);
      
      filterNodeRef.current = filter;
      lfoNodeRef.current = lfo;
      lfoGainNodeRef.current = lfoGain;
    }
    
    gainNode.connect(context.destination);
    
    // Store references
    noiseNodeRef.current = noiseNode;
    gainNodeRef.current = gainNode;
    
    // Start playback
    noiseNode.start();
    
    // Fade in
    fadeIn();
    
    setIsPlaying(true);
  };

  const stopSound = () => {
    if (!isPlaying) return;
    
    // Fade out
    fadeOut(() => {
      // Stop and disconnect nodes
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      
      if (filterNodeRef.current) {
        filterNodeRef.current.disconnect();
        filterNodeRef.current = null;
      }
      
      if (lfoNodeRef.current) {
        lfoNodeRef.current.stop();
        lfoNodeRef.current.disconnect();
        lfoNodeRef.current = null;
      }
      
      if (lfoGainNodeRef.current) {
        lfoGainNodeRef.current.disconnect();
        lfoGainNodeRef.current = null;
      }
      
      setIsPlaying(false);
    });
  };

  const fadeIn = () => {
    if (!gainNodeRef.current || !audioContextRef.current) return;
    
    const targetVolume = volume / 100;
    const fadeTime = 0.5; // 500ms fade
    
    gainNodeRef.current.gain.linearRampToValueAtTime(
      targetVolume,
      audioContextRef.current.currentTime + fadeTime
    );
  };

  const fadeOut = (callback: () => void) => {
    if (!gainNodeRef.current || !audioContextRef.current) return;
    
    const fadeTime = 0.5; // 500ms fade
    
    gainNodeRef.current.gain.linearRampToValueAtTime(
      0,
      audioContextRef.current.currentTime + fadeTime
    );
    
    // Clear any existing fade interval
    if (fadeIntervalRef.current) {
      clearTimeout(fadeIntervalRef.current);
    }
    
    // Execute callback after fade completes
    fadeIntervalRef.current = setTimeout(callback, fadeTime * 1000);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    onVolumeChange?.(newVolume);
  };

  const handleSoundTypeChange = (newSoundType: SoundType) => {
    if (newSoundType === soundType) return;
    
    const wasPlaying = isPlaying;
    
    if (wasPlaying) {
      stopSound();
    }
    
    setSoundType(newSoundType);
    onSoundTypeChange?.(newSoundType);
    
    // Restart with new sound type if it was playing
    setTimeout(() => {
      if (wasPlaying && isActive) {
        startSound();
      }
    }, 600); // Wait for fade out to complete
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Ambient Sounds</h3>
        <div className="flex items-center gap-2">
          {volume === 0 ? (
            <VolumeX className="w-5 h-5 text-gray-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-sm text-gray-400">{volume}%</span>
        </div>
      </div>

      {/* Sound Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {soundOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSoundTypeChange(option.id)}
            className={`p-3 rounded-lg text-left transition-all ${
              soundType === option.id
                ? 'bg-blue-500/20 border border-blue-500'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-sm font-medium text-white">{option.label}</div>
            <div className="text-xs text-gray-400 mt-1">{option.description}</div>
          </button>
        ))}
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Volume</label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${volume}%, rgba(255, 255, 255, 0.1) ${volume}%, rgba(255, 255, 255, 0.1) 100%)`,
          }}
        />
      </div>

      {/* Playing Indicator */}
      {isPlaying && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Playing {soundOptions.find(o => o.id === soundType)?.label}</span>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: rgb(59, 130, 246);
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: rgb(59, 130, 246);
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};