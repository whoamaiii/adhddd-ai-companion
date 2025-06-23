import React, { useRef, useEffect, useCallback } from 'react';

interface AudioVisualizerProps {
  inputNode: GainNode | null;
  outputNode: GainNode | null;
  visualState: 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
  width?: number;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  inputNode,
  outputNode,
  visualState,
  width = 280,
  height = 120
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputDataArrayRef = useRef<Uint8Array | null>(null);
  const outputDataArrayRef = useRef<Uint8Array | null>(null);
  
  // Performance optimization for mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const targetFPS = isMobile ? 30 : 60;
  const frameInterval = 1000 / targetFPS;
  let lastFrameTime = 0;

  // Initialize audio analyzers
  useEffect(() => {
    if (inputNode && inputNode.context.state === 'running') {
      const analyser = inputNode.context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      inputNode.connect(analyser);
      inputAnalyserRef.current = analyser;
      inputDataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    if (outputNode && outputNode.context.state === 'running') {
      const analyser = outputNode.context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      outputNode.connect(analyser);
      outputAnalyserRef.current = analyser;
      outputDataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    return () => {
      if (inputAnalyserRef.current) {
        inputAnalyserRef.current.disconnect();
        inputAnalyserRef.current = null;
      }
      if (outputAnalyserRef.current) {
        outputAnalyserRef.current.disconnect();
        outputAnalyserRef.current = null;
      }
    };
  }, [inputNode, outputNode]);

  const drawWaveform = useCallback((
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    color: string,
    yOffset: number,
    heightMultiplier: number = 1
  ) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height / 2;
    const sliceWidth = width / dataArray.length;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height / 2 * heightMultiplier) + yOffset;
      
      if (i === 0) {
        ctx.moveTo(0, y);
      } else {
        ctx.lineTo(i * sliceWidth, y);
      }
    }
    
    ctx.stroke();
  }, []);

  const drawIdleAnimation = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Breathing circle animation
    const breathScale = 0.8 + Math.sin(time * 0.001) * 0.2;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3 * breathScale;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.3)'; // Purple with transparency
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  const drawErrorState = useCallback((ctx: CanvasRenderingContext2D) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Red color for error
    ctx.lineWidth = 3;
    
    // Draw X symbol
    const padding = 40;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.moveTo(width - padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
  }, []);

  const animate = useCallback((currentTime: number) => {
    if (currentTime - lastFrameTime < frameInterval) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameTime = currentTime;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;
    
    // Clear canvas with slight fade for smooth trails
    ctx.fillStyle = 'rgba(249, 250, 251, 0.9)'; // var(--bg-card) with transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    switch (visualState) {
      case 'idle':
        drawIdleAnimation(ctx, currentTime);
        break;
        
      case 'listening':
        if (inputAnalyserRef.current && inputDataArrayRef.current) {
          inputAnalyserRef.current.getByteTimeDomainData(inputDataArrayRef.current);
          drawWaveform(ctx, inputDataArrayRef.current, '#7c3aed', canvas.height / 2, 1.2); // Purple for input
        }
        break;
        
      case 'speaking':
        if (outputAnalyserRef.current && outputDataArrayRef.current) {
          outputAnalyserRef.current.getByteTimeDomainData(outputDataArrayRef.current);
          drawWaveform(ctx, outputDataArrayRef.current, '#10b981', canvas.height / 2, 1.5); // Green for output
        }
        break;
        
      case 'processing':
        // Processing animation - rotating dots
        const dotCount = 8;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 30;
        
        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2 + currentTime * 0.002;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          const size = 3 + Math.sin(currentTime * 0.005 + i) * 2;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(124, 58, 237, ${0.3 + (i / dotCount) * 0.7})`;
          ctx.fill();
        }
        break;
        
      case 'error':
        drawErrorState(ctx);
        break;
    }
    
    // Show both waveforms when both are active
    if (visualState === 'speaking' && inputAnalyserRef.current && inputDataArrayRef.current) {
      inputAnalyserRef.current.getByteTimeDomainData(inputDataArrayRef.current);
      drawWaveform(ctx, inputDataArrayRef.current, 'rgba(124, 58, 237, 0.4)', canvas.height / 4, 0.5); // Smaller input wave
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [visualState, drawWaveform, drawIdleAnimation, drawErrorState, frameInterval]);

  // Start animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full rounded-lg bg-[var(--bg-light-accent)]"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};