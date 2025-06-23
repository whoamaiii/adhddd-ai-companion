/// <reference types="vite/client" />

// global.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gdm-live-audio-body-double': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'api-key'?: string; // Corresponds to the 'apiKey' property in the Lit component, make it optional
        },
        HTMLElement
      >;
      'gdm-live-audio-visuals-3d': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          inputNode?: GainNode | null;
          outputNode?: GainNode | null;
        },
        HTMLElement
      >;
    }
  }
}

// Adding an empty export to make this a module, which is good practice for .d.ts files.
export {};
