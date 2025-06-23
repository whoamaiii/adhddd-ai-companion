import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
// @ts-ignore - We rely on ambient React types from the app
import React from 'react';
// @ts-ignore - types are provided by @types/react-dom which should be in project
import { createRoot, Root } from 'react-dom/client';
import { AudioVisualizer } from './AudioVisualizer';

@customElement('gdm-live-audio-visuals-3d')
export class GdmLiveAudioVisuals3D extends LitElement {
  @property({ type: Object }) inputNode: GainNode | null = null;
  @property({ type: Object }) outputNode: GainNode | null = null;
  
  @state() private visualState: 'idle' | 'listening' | 'processing' | 'speaking' | 'error' = 'idle';
  
  private containerElement: HTMLDivElement | null = null;
  private reactRoot: Root | null = null;
  private flashTimeout: number | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 120px;
    }
    
    .visualizer-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: box-shadow 0.2s ease;
    }

    /* Flash effect */
    .visualizer-container.flash {
      box-shadow: 0 0 0 3px var(--success-color, #4caf50);
    }
  `;

  // Public method to update visual state from parent component
  updateVisualState(state: 'idle' | 'listening' | 'processing' | 'speaking' | 'error') {
    this.visualState = state;
  }

  firstUpdated() {
    // Create React root when the component is first rendered
    this.containerElement = this.shadowRoot?.querySelector('.visualizer-container') as HTMLDivElement;
    if (this.containerElement) {
      this.reactRoot = createRoot(this.containerElement);
      this.renderReactComponent();
    }
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    // Re-render React component when properties change
    if (changedProperties.has('inputNode') || changedProperties.has('outputNode') || changedProperties.has('visualState')) {
      this.renderReactComponent();
    }
  }

  private renderReactComponent() {
    if (!this.reactRoot || !this.containerElement) return;

    // Render the React AudioVisualizer component
    this.reactRoot.render(
      React.createElement(AudioVisualizer, {
        inputNode: this.inputNode,
        outputNode: this.outputNode,
        visualState: this.visualState,
        width: 280,
        height: 120
      })
    );
  }

  disconnectedCallback() {
    // Clean up React root when component is removed
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
    super.disconnectedCallback();
  }

  /**
   * Briefly flashes the visualizer to acknowledge a recognized voice command.
   */
  public flashRecognition() {
    if (!this.containerElement) return;

    // Add a CSS class that triggers the flash animation
    this.containerElement.classList.add('flash');

    // Clear any existing timeout to avoid stacking
    if (this.flashTimeout) {
      clearTimeout(this.flashTimeout);
    }

    // Remove the class after the animation duration (200ms)
    this.flashTimeout = window.setTimeout(() => {
      this.containerElement?.classList.remove('flash');
      this.flashTimeout = null;
    }, 200);
  }

  render() {
    return html`
      <div class="visualizer-container"></div>
    `;
  }
}