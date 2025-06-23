/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createBlob, decode, decodeAudioData } from './utils'; // Assuming utils.ts exists or will be created
import './visual-3d'; // Ensure this path is correct relative to this file or adjust as needed

@customElement('gdm-live-audio-body-double')
export class GdmLiveAudioBodyDouble extends LitElement {
  @property({ type: String, attribute: 'api-key' }) apiKey = ''; // Explicitly map to api-key attribute

  @state() isRecording = false;
  @state() status = 'Inactive';
  @state() error = '';

  private client: GoogleGenAI | null = null;
  private session: Session | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  
  @state() private inputNode: GainNode | null = null;
  @state() private outputNode: GainNode | null = null;

  private nextStartTime = 0;
  private mediaStream: MediaStream | null = null;
  private mediaStreamSourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  private sources = new Set<AudioBufferSourceNode>(); // For managing output audio sources

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
    } else if (!this.session) {
        this.updateError("Failed to initialize session. Cannot start recording.");
    }
  }

  public deactivateSession() {
    this.stopRecording(); // This is synchronous
    if (this.session) {
      // Assuming session.close() is synchronous or we don't need to wait for it.
      // If session.close() were async and important to await: `await this.session.close();`
      this.session.close();
      this.session = null;
    }
    this.updateStatus('Session ended. Click Start to begin again.');
  }

  private async initSession() {
    if (!this.client) {
      this.updateError('Gemini client not initialized.');
      return;
    }
    // Using a model consistent with general guidelines
    const model = 'gemini-2.5-flash-preview-04-17'; 

    try {
      this.updateStatus('Connecting to AI...');
      this.session = await this.client.chat.create({
        model: model,
        systemInstruction: { parts: [{ text: "You are a friendly and supportive companion. The user is currently cleaning their space. Your role is to keep them company with light, engaging conversation. You can ask how they're feeling, chat about interesting topics, or offer general encouragement. Avoid giving specific cleaning instructions. Just be a pleasant presence."}]},
      });
      this.updateStatus('Connected. Ready to record.');
    } catch (e: any) {
      console.error('Error initializing session:', e);
      this.updateError(`Session init error: ${e.message}`);
      this.session = null; // Ensure session is null on error
    }
  }


  private async processMessage(message: LiveServerMessage) { 
    const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData;
    if (audio && this.outputAudioContext && this.outputNode) {
      this.nextStartTime = Math.max(
        this.nextStartTime,
        this.outputAudioContext.currentTime,
      );
      try {
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
        });
        source.start(this.nextStartTime);
        this.nextStartTime = this.nextStartTime + audioBuffer.duration;
        this.sources.add(source);
      } catch (err) {
        console.error("Error decoding or playing audio:", err);
        this.updateError("Playback error.");
      }
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
  }

  private updateError(msg: string) {
    this.error = msg;
    console.error("LiveAudio Error:", msg);
  }

  private async startRecording() {
    if (this.isRecording) return;
    if (!this.inputAudioContext || !this.inputNode || !this.session) {
      this.updateError('Audio context or session not ready for recording.');
      this.isRecording = false; 
      return;
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

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording || !this.session) return;
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0); 

         try {
            // This section remains a placeholder as per original code's intent.
            // Direct audio blob sending to a standard Gemini chat session is not supported.
            // This would require STT -> chat.sendMessage -> TTS.
             console.log("Attempting to send audio data chunk (placeholder)...");
             // Example: this.session.sendRealtimeInput({media: createBlob(pcmData)}); 
         } catch (e) {
             console.error("Error sending audio data (placeholder):", e);
             this.updateError("Error sending audio.");
             this.stopRecording();
         }
      };

      this.mediaStreamSourceNode.connect(this.scriptProcessorNode);
      // DO NOT connect scriptProcessorNode to destination, to avoid hearing raw mic input.
      // this.scriptProcessorNode.connect(this.inputAudioContext.destination); // Removed this line

      this.isRecording = true;
      this.updateStatus('🔴 Recording...');
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
  }

  private handleResetClick() {
    this.deactivateSession(); 
    this.updateStatus('Session Reset. Ready to Start.');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.deactivateSession(); 
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
    `;
  }
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
  // Fallback for createScriptProcessor if it's not standard on AudioContext type
  interface AudioContext {
    createScriptProcessor?(bufferSize: number, numberOfInputChannels: number, numberOfOutputChannels: number): ScriptProcessorNode;
  }
}

