/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { LitElement, css, html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { createBlob, decode, decodeAudioData } from './utils'; // Assuming utils.ts exists or will be created
import './visual-3d'; // Ensure this path is correct relative to this file or adjust as needed
import type { GdmLiveAudioVisuals3D } from './visual-3d';
import { parseVoiceCommand, CommandMatch } from '../services/voiceCommandService';

@customElement('gdm-live-audio-body-double')
export class GdmLiveAudioBodyDouble extends LitElement {
  @property({ type: String, attribute: 'api-key' }) apiKey = ''; // Explicitly map to api-key attribute

  @state() isRecording = false;
  @state() status = 'Inactive';
  @state() error = '';
  @state() visualState: 'idle' | 'listening' | 'processing' | 'speaking' | 'error' = 'idle';
  @state() lastRecognizedCommand: CommandMatch | null = null;
  @state() recognitionActive = false;

  private client: GoogleGenAI | null = null;
  private session: Session | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private useFallbackMode: boolean = false; // Track if we're using fallback mode
  private speechRecognition: any = null; // For Web Speech API fallback
  private speechSynthesis: SpeechSynthesis | null = null; // For TTS fallback
  private commandRecognition: any = null; // Separate recognition instance for commands
  private commandRecognitionTimeout: number | null = null;
  
  @state() private inputNode: GainNode | null = null;
  @state() private outputNode: GainNode | null = null;

  private nextStartTime = 0;
  private mediaStream: MediaStream | null = null;
  private mediaStreamSourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  private sources = new Set<AudioBufferSourceNode>(); // For managing output audio sources
  
  @query('gdm-live-audio-visuals-3d')
  private visualComponent?: GdmLiveAudioVisuals3D;

  static styles = css`
    :host {
      display: block;
      color: var(--text-primary); /* Use app's text color */
      padding: 10px; /* Add some padding for the component itself */
    }
    #status-error-container {
      min-height: 20px; /* Ensure space for status/error messages */
      margin-bottom: 10px;
      text-align: center;
      font-size: 0.8em;
    }
    #status-text {
      color: var(--text-secondary);
    }
    #error-text {
      color: var(--error-color);
      font-weight: bold;
    }

    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: row; /* Changed to row for a more compact layout */
      gap: 10px;

      button {
        outline: none;
        border: 1px solid var(--border-medium);
        color: var(--text-primary);
        border-radius: 8px; /* Slightly less rounded */
        background: var(--bg-card); /* Use app's card background */
        width: 48px; /* Adjusted size */
        height: 48px;
        cursor: pointer;
        font-size: 20px; /* Adjusted size */
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: var(--bg-light-accent); /* Use app's light accent for hover */
        }
      }

      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
      /* Specific styling for start/stop buttons to hide one based on state */
      button#startButton[disabled], button#stopButton[disabled] {
        display: none;
      }
    }
    svg {
      fill: var(--text-primary); /* Ensure SVG icons use app's text color */
    }
    
    .command-feedback {
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-accent);
      color: var(--text-primary);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85em;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      
      &.visible {
        opacity: 1;
      }
    }
    
    .recognition-indicator {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-secondary);
      opacity: 0.5;
      transition: all 0.3s ease;
      
      &.active {
        background: var(--success-color, #4caf50);
        opacity: 1;
        animation: pulse 1.5s infinite;
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.8;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    // apiKey might not be set yet if passed as an attribute.
    // Initialization will be handled by `updated` when apiKey is set.
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('apiKey')) {
      // API key has changed (or first set). Deactivate existing session and client.
      if (this.session || this.isRecording) {
        this.deactivateSession(); // Stops recording and closes the session.
      }
      this.client = null; // Nullify client to force re-initialization

      // Clear any pending audio output
      this.sources.forEach(source => { try { source.stop(); } catch(e){ /* ignore */ } });
      this.sources.clear();
      if (this.outputAudioContext) {
          this.nextStartTime = this.outputAudioContext.currentTime;
      } else {
          this.nextStartTime = 0;
      }

      if (this.apiKey) {
        this.initClientAndContexts();
      } else {
        this.updateError('API Key is now empty. Live Audio disabled.');
        // Client is already nullified. Contexts will remain but won't be used.
      }
    }
  }

  private initClientAndContexts() {
    this.error = ''; // Clear previous errors on init
    if (!this.apiKey) {
      this.updateError('API Key is missing for Live Audio.');
      this.client = null;
      // AudioContexts might still exist but will be unusable without a client
      this.updateStatus('API Key missing.');
      return;
    }

    this.client = new GoogleGenAI({ apiKey: this.apiKey });
    
    // Initialize speech synthesis for fallback
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
    
    // Initialize AudioContexts if they don't exist or were closed
    if (!this.inputAudioContext || this.inputAudioContext.state === 'closed') {
        this.inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    }
    // Create or re-create gain node for input visualizer
    this.inputNode = this.inputAudioContext.createGain();

    if (!this.outputAudioContext || this.outputAudioContext.state === 'closed') {
        this.outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    // Create or re-create gain node for output visualizer and connect to destination
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);
    
    this.initAudioPlaybackState();
    this.updateStatus('Ready. Press Start.');
    
    // Initialize speech recognition for commands
    this.initSpeechRecognition();
  }
  
  private initSpeechRecognition() {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }
    
    try {
      // Create a separate recognition instance for command detection
      this.commandRecognition = new SpeechRecognition();
      this.commandRecognition.continuous = true;
      this.commandRecognition.interimResults = true;
      this.commandRecognition.lang = 'en-US';
      this.commandRecognition.maxAlternatives = 3; // Get multiple alternatives for better matching
      
      // Handle recognition results
      this.commandRecognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        const isFinal = event.results[last].isFinal;
        
        // Process the transcript for voice commands
        const commandMatch = parseVoiceCommand(transcript);
        
        if (commandMatch && commandMatch.confidence >= 0.7) {
          // Visual feedback for recognized command
          this.lastRecognizedCommand = commandMatch;
          this.showCommandFeedback(commandMatch);
          
          if (isFinal) {
            // Emit command event to parent component
            this.dispatchEvent(new CustomEvent('voice-command', {
              detail: commandMatch,
              bubbles: true,
              composed: true
            }));
            
            // Clear command feedback after a delay
            setTimeout(() => {
              this.lastRecognizedCommand = null;
            }, 2000);
          }
        }
        
        // If it's a final result and not a command, it might be conversation
        if (isFinal && (!commandMatch || commandMatch.confidence < 0.7)) {
          // In fallback mode, this will be handled by the main speech recognition
          if (!this.useFallbackMode) {
            console.log('Non-command speech:', transcript);
          }
        }
      };
      
      // Handle recognition errors
      this.commandRecognition.onerror = (event: any) => {
        console.error('Command recognition error:', event.error);
        
        // Don't show error for common issues
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        
        if (event.error === 'not-allowed') {
          this.updateError('Microphone access denied for voice commands');
        } else {
          console.warn(`Voice command recognition error: ${event.error}`);
        }
        
        // Try to restart recognition after an error
        if (this.recognitionActive && event.error !== 'not-allowed') {
          setTimeout(() => {
            this.startCommandRecognition();
          }, 1000);
        }
      };
      
      // Handle recognition end
      this.commandRecognition.onend = () => {
        console.log('Command recognition ended');
        
        // Restart if still active
        if (this.recognitionActive) {
          setTimeout(() => {
            this.startCommandRecognition();
          }, 100);
        }
      };
      
      // Handle speech start/end for visual feedback
      this.commandRecognition.onspeechstart = () => {
        console.log('Speech detected for commands');
      };
      
      this.commandRecognition.onspeechend = () => {
        console.log('Speech ended for commands');
      };
      
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
    }
  }
  
  private startCommandRecognition() {
    if (!this.commandRecognition) return;
    
    try {
      this.commandRecognition.start();
      this.recognitionActive = true;
      console.log('Command recognition started');
    } catch (error: any) {
      // Ignore if already started
      if (error.message && error.message.includes('already started')) {
        console.log('Command recognition already active');
      } else {
        console.error('Error starting command recognition:', error);
      }
    }
  }
  
  private stopCommandRecognition() {
    if (!this.commandRecognition) return;
    
    try {
      this.recognitionActive = false;
      this.commandRecognition.stop();
      console.log('Command recognition stopped');
    } catch (error) {
      console.error('Error stopping command recognition:', error);
    }
  }
  
  private showCommandFeedback(command: CommandMatch) {
    // Update visual state briefly to show command was recognized
    const previousState = this.visualState;
    
    // Flash the visual component to indicate command recognition
    if (this.visualComponent) {
      this.visualComponent.flashRecognition?.();
    }
    
    // Log the recognized command
    console.log(`Command recognized: ${command.command.action} (confidence: ${command.confidence.toFixed(2)})`);
    
    // Update status briefly
    const previousStatus = this.status;
    this.updateStatus(`Command: ${command.command.description}`);
    
    // Restore previous status after delay
    if (this.commandRecognitionTimeout) {
      clearTimeout(this.commandRecognitionTimeout);
    }
    
    this.commandRecognitionTimeout = window.setTimeout(() => {
      if (this.status.startsWith('Command:')) {
        this.updateStatus(previousStatus);
      }
      this.commandRecognitionTimeout = null;
    }, 1500);
  }
  
  private initAudioPlaybackState() {
    if(this.outputAudioContext){
      this.nextStartTime = this.outputAudioContext.currentTime;
    }
  }

  public async activateSession() {
    this.error = ''; // Clear previous errors
    if (!this.apiKey) {
        this.updateError("API Key is not set. Cannot activate session.");
        return;
    }
    if (!this.client || !this.inputAudioContext || !this.outputAudioContext) {
        this.updateError("Audio client/context not initialized.");
        // Attempt re-init if API key is present but client/contexts are somehow not set up
        if (this.apiKey) {
            console.warn("activateSession: Client/contexts not initialized despite API key. Attempting re-init.");
            this.initClientAndContexts();
        }
        // Check again after potential re-init
        if(!this.client || !this.inputAudioContext || !this.outputAudioContext) {
             this.updateError("Audio client/context failed to initialize. Cannot activate session.");
             return;
        }
    }

    if (!this.session) {
      // initSession is async, but it's not clear if await is needed here as it sets this.session
      // Let's assume initSession updates status and handles its own errors.
      await this.initSession(); 
    }

    if (this.session && !this.isRecording) {
      // startRecording is async
      await this.startRecording();
      // Start command recognition alongside audio recording
      this.startCommandRecognition();
    } else if (!this.session) {
        this.updateError("Failed to initialize session. Cannot start recording.");
    }
  }

  public deactivateSession() {
    this.stopRecording(); // This is synchronous
    
    // Stop command recognition
    this.stopCommandRecognition();
    
    if (this.session) {
      // Assuming session.close() is synchronous or we don't need to wait for it.
      // If session.close() were async and important to await: `await this.session.close();`
      try {
        if (typeof this.session.close === 'function') {
          this.session.close();
        }
      } catch (e) {
        console.error('Error closing session:', e);
      }
      this.session = null;
    }
    
    // Stop any ongoing TTS
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    
    // Clear any command feedback
    this.lastRecognizedCommand = null;
    if (this.commandRecognitionTimeout) {
      clearTimeout(this.commandRecognitionTimeout);
      this.commandRecognitionTimeout = null;
    }
    
    this.useFallbackMode = false;
    this.updateStatus('Session ended. Click Start to begin again.');
  }

  private async initSession() {
    if (!this.client) {
      this.updateError('Gemini client not initialized.');
      return;
    }
    // Using Gemini 2.0 Flash for live audio support
    const model = 'gemini-2.0-flash-exp'; 

    try {
      this.updateStatus('Connecting to AI...');
      this.visualState = 'processing';
      if (this.visualComponent) {
        this.visualComponent.updateVisualState('processing');
      }
      
      // Try to create a live session with audio modality
      // Check if live API is available
      if (!this.client.live) {
        console.warn('Live API not available, falling back to text-based interaction');
        this.useFallbackMode = true;
        await this.initFallbackSession();
        return;
      }
      
      try {
        this.session = await this.client.live.create({
        model: model,
        systemInstruction: { parts: [{ text: "You are a friendly and supportive companion. The user is currently cleaning their space. Your role is to keep them company with light, engaging conversation. You can ask how they're feeling, chat about interesting topics, or offer general encouragement. Avoid giving specific cleaning instructions. Just be a pleasant presence."}]},
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          candidateCount: 1,
        },
        // Enable audio input and output
        tools: [],
      });
      
      // Set up message handler for server responses
      if (this.session) {
        this.session.on('message', (message: LiveServerMessage) => {
          this.processMessage(message);
        });
      }
      
        this.updateStatus('Connected. Ready to record.');
      } catch (liveError: any) {
        console.warn('Live API error, falling back to text-based interaction:', liveError);
        this.useFallbackMode = true;
        await this.initFallbackSession();
      }
    } catch (e: any) {
      console.error('Error initializing session:', e);
      this.updateError(`Session init error: ${e.message}`);
      this.session = null; // Ensure session is null on error
    }
  }
  
  private async initFallbackSession() {
    if (!this.client) {
      this.updateError('Gemini client not initialized.');
      return;
    }
    
    try {
      this.updateStatus('Initializing text-based interaction...');
      // Use standard chat API with the same model
      const model = this.client.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: "You are a friendly and supportive companion. The user is currently cleaning their space. Your role is to keep them company with light, engaging conversation. You can ask how they're feeling, chat about interesting topics, or offer general encouragement. Avoid giving specific cleaning instructions. Just be a pleasant presence. Keep responses concise for voice synthesis.",
      });
      
      // Create a chat session
      this.session = await model.startChat({
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 150, // Keep responses short for TTS
        },
      });
      
      // Initialize Web Speech API for speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = 'en-US';
        
        this.speechRecognition.onresult = async (event: any) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          
          if (event.results[last].isFinal) {
            console.log('Final transcript:', transcript);
            await this.processFallbackText(transcript);
          }
        };
        
        this.speechRecognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            this.updateError('Microphone access denied');
          }
        };
      }
      
      this.updateStatus('Connected (Text mode). Ready to record.');
    } catch (e: any) {
      console.error('Error initializing fallback session:', e);
      this.updateError(`Fallback session error: ${e.message}`);
      this.session = null;
    }
  }
  
  private async processFallbackText(text: string) {
    if (!this.session) return;
    
    try {
      this.visualState = 'processing';
      if (this.visualComponent) {
        this.visualComponent.updateVisualState('processing');
      }
      
      // Send text to Gemini
      const result = await this.session.sendMessage(text);
      const response = result.response.text();
      
      // Use TTS to speak the response
      if (this.speechSynthesis && response) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          this.visualState = 'speaking';
          if (this.visualComponent) {
            this.visualComponent.updateVisualState('speaking');
          }
        };
        
        utterance.onend = () => {
          this.updateVisualState();
        };
        
        this.speechSynthesis.speak(utterance);
      }
    } catch (e: any) {
      console.error('Error processing text:', e);
      this.updateError('Error processing conversation');
    }
  }


  private async processMessage(message: LiveServerMessage) { 
    // Handle audio responses from Gemini
    const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData;
    if (audio && this.outputAudioContext && this.outputNode) {
      this.nextStartTime = Math.max(
        this.nextStartTime,
        this.outputAudioContext.currentTime,
      );
      try {
        // Decode the audio data
        const audioBuffer = await decodeAudioData(
          decode(audio.data), 
          this.outputAudioContext,
          24000, 
          1,     
        );
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        source.addEventListener('ended', () => {
          this.sources.delete(source);
          // Update visual state when no more audio is playing
          if (this.sources.size === 0) {
            this.updateVisualState();
          }
        });
        source.start(this.nextStartTime);
        this.nextStartTime = this.nextStartTime + audioBuffer.duration;
        this.sources.add(source);
        // Update visual state to speaking when audio starts
        this.visualState = 'speaking';
        if (this.visualComponent) {
          this.visualComponent.updateVisualState('speaking');
        }
      } catch (err) {
        console.error("Error decoding or playing audio:", err);
        this.updateError("Playback error.");
      }
    }
    
    // Handle text responses (fallback or additional context)
    const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
    if (text) {
      console.log("Gemini text response:", text);
      // You could display this text in UI if needed
    }

    const interrupted = message.serverContent?.interrupted;
    if (interrupted) {
      for (const source of this.sources.values()) {
        try { source.stop(); } catch(e) {/* ignore */}
        this.sources.delete(source);
      }
      if (this.outputAudioContext) {
        this.nextStartTime = this.outputAudioContext.currentTime;
      } else {
        this.nextStartTime = 0;
      }
    }
  }


  private updateStatus(msg: string) {
    this.status = msg;
    this.error = ''; 
    this.updateVisualState();
  }

  private updateError(msg: string) {
    this.error = msg;
    console.error("LiveAudio Error:", msg);
    this.visualState = 'error';
    if (this.visualComponent) {
      this.visualComponent.updateVisualState('error');
    }
  }
  
  private updateVisualState() {
    if (!this.visualComponent) return;
    
    // Map status messages to visual states
    let newState: 'idle' | 'listening' | 'processing' | 'speaking' | 'error' = 'idle';
    
    if (this.error) {
      newState = 'error';
    } else if (this.sources.size > 0) {
      // Audio is currently playing
      newState = 'speaking';
    } else if (this.status.includes('Recording')) {
      newState = 'listening';
    } else if (this.status.includes('Connecting') || this.status.includes('processing')) {
      newState = 'processing';
    } else {
      newState = 'idle';
    }
    
    this.visualState = newState;
    this.visualComponent.updateVisualState(newState);
  }

  private async startRecording() {
    if (this.isRecording) return;
    if (!this.inputAudioContext || !this.inputNode || !this.session) {
      this.updateError('Audio context or session not ready for recording.');
      this.isRecording = false; 
      return;
    }
    
    // If using fallback mode, start speech recognition instead
    if (this.useFallbackMode && this.speechRecognition) {
      try {
        this.speechRecognition.start();
        this.isRecording = true;
        this.updateStatus('🔴 Recording (Speech Recognition)...');
        this.visualState = 'listening';
        if (this.visualComponent) {
          this.visualComponent.updateVisualState('listening');
        }
        return;
      } catch (e: any) {
        console.error('Error starting speech recognition:', e);
        this.updateError('Error starting speech recognition');
        return;
      }
    }

    // Ensure AudioContext is running
    if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
    }
    this.updateStatus('Requesting microphone...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            sampleRate: 16000, 
            channelCount: 1,    
            echoCancellation: true,
        },
        video: false,
      });

      this.updateStatus('Mic granted. Capturing...');
      this.mediaStreamSourceNode = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.mediaStreamSourceNode.connect(this.inputNode); // Connect to visualizer node

      const bufferSize = 4096; 
      // Fallback for older browsers that might not have AudioWorklet widely supported or for simplicity.
      // For modern applications, AudioWorklet is preferred over ScriptProcessorNode.
      if (!this.inputAudioContext.createScriptProcessor) {
        this.updateError("ScriptProcessorNode not supported. Audio input may not work.");
        // Potentially fall back to AudioWorklet if implemented, or accept failure.
        return;
      }
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(bufferSize, 1, 1);

      this.scriptProcessorNode.onaudioprocess = async (audioProcessingEvent) => {
        if (!this.isRecording || !this.session) return;
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0); 

        try {
          // Create WAV blob from PCM data for Gemini Live API
          const audioBlob = createBlob(pcmData, 16000);
          
          // Convert blob to base64 for sending
          const reader = new FileReader();
          reader.onloadend = async () => {
            if (reader.result && typeof reader.result === 'string') {
              // Extract base64 data from data URL
              const base64Data = reader.result.split(',')[1];
              
              // Send audio data to Gemini Live API
              if (this.session) {
                try {
                  await this.session.sendRealtimeInput({
                    media: {
                      data: base64Data,
                      mimeType: 'audio/wav'
                    }
                  });
                } catch (sendError) {
                  console.error("Error sending audio to Gemini:", sendError);
                }
              }
            }
          };
          reader.readAsDataURL(audioBlob);
          
        } catch (e) {
          console.error("Error processing audio data:", e);
          this.updateError("Error processing audio.");
          this.stopRecording();
        }
      };

      this.mediaStreamSourceNode.connect(this.scriptProcessorNode);
      // DO NOT connect scriptProcessorNode to destination, to avoid hearing raw mic input.
      // this.scriptProcessorNode.connect(this.inputAudioContext.destination); // Removed this line

      this.isRecording = true;
      this.updateStatus('🔴 Recording...');
      this.visualState = 'listening';
      if (this.visualComponent) {
        this.visualComponent.updateVisualState('listening');
      }
    } catch (err: any) {
      console.error('Error starting recording:', err);
      this.updateError(`Mic Error: ${err.message}`);
      this.stopRecording(); 
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext) {
      // Only update status if it was genuinely trying to stop something or was in an active state.
      if (this.isRecording) this.updateStatus('Recording stopped.');
      this.isRecording = false;
      return;
    }
    
    this.isRecording = false;
    
    // Stop speech recognition if in fallback mode
    if (this.useFallbackMode && this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
    } 

    if (this.scriptProcessorNode) {
      this.scriptProcessorNode.onaudioprocess = null; 
      this.scriptProcessorNode.disconnect();
      this.scriptProcessorNode = null;
    }
    if (this.mediaStreamSourceNode) {
      this.mediaStreamSourceNode.disconnect();
      this.mediaStreamSourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    
    this.updateStatus('Recording stopped.');
    this.visualState = 'idle';
    if (this.visualComponent) {
      this.visualComponent.updateVisualState('idle');
    }
  }

  private handleResetClick() {
    this.deactivateSession(); 
    this.updateStatus('Session Reset. Ready to Start.');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.deactivateSession(); 
    
    // Clean up command recognition
    if (this.commandRecognition) {
      try {
        this.commandRecognition.stop();
        this.commandRecognition.onresult = null;
        this.commandRecognition.onerror = null;
        this.commandRecognition.onend = null;
        this.commandRecognition = null;
      } catch (e) {
        console.error("Error cleaning up command recognition:", e);
      }
    }
    
    if(this.inputAudioContext && this.inputAudioContext.state !== 'closed') {
      this.inputAudioContext.close().catch(e => console.error("Error closing input audio context:", e));
      this.inputAudioContext = null;
    }
    if(this.outputAudioContext && this.outputAudioContext.state !== 'closed') {
      this.outputAudioContext.close().catch(e => console.error("Error closing output audio context:", e));
      this.outputAudioContext = null;
    }
  }

  render() {
    return html`
      <div style="position: relative;">
        <div class="recognition-indicator ${this.recognitionActive ? 'active' : ''}" 
             title="${this.recognitionActive ? 'Voice commands active' : 'Voice commands inactive'}">
        </div>
        
        <div class="command-feedback ${this.lastRecognizedCommand ? 'visible' : ''}">
          ${this.lastRecognizedCommand ? 
            html`<span>🎯 ${this.lastRecognizedCommand.command.description}</span>` : 
            ''}
        </div>
        
        <div id="status-error-container">
          ${this.error ? html`<div id="error-text">${this.error}</div>` : html`<div id="status-text">${this.status}</div>`}
        </div>
        
        <div class="controls">
          <button
            id="resetButton"
            @click=${this.handleResetClick}
            ?disabled=${this.isRecording && false} /* Reset should ideally always be enabled, or disabled only during critical ops */
            title="Reset Session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
              <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
            </svg>
          </button>
          <button
            id="startButton"
            @click=${this.activateSession} 
            ?disabled=${this.isRecording || !this.apiKey} /* Also disable if no API key */
            title="Start Recording"
          >
            <svg viewBox="0 0 100 100" width="24px" height="24px" fill="#c80000">
              <circle cx="50" cy="50" r="50" />
            </svg>
          </button>
          <button
            id="stopButton"
            @click=${this.deactivateSession}
            ?disabled=${!this.isRecording}
            title="Stop Recording"
          >
            <svg viewBox="0 0 100 100" width="24px" height="24px" fill="#000000">
              <rect x="0" y="0" width="100" height="100" rx="15" />
            </svg>
          </button>
        </div>
        
        <gdm-live-audio-visuals-3d
          .inputNode=${this.inputNode}
          .outputNode=${this.outputNode}
        ></gdm-live-audio-visuals-3d>
      </div>
    `;
  }
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  // Fallback for createScriptProcessor if it's not standard on AudioContext type
  interface AudioContext {
    createScriptProcessor?(bufferSize: number, numberOfInputChannels: number, numberOfOutputChannels: number): ScriptProcessorNode;
  }
}

