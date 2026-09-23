'use client';

import React, { useEffect, useRef } from 'react';

export interface WinVideoOverlayProps {
  src: string;
  onEnded?: () => void;
  width?: number;
  height?: number;
}

const VS_SOURCE = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

const FS_SOURCE = `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  // Measure pixel brightness from color channels
  float brightness = max(color.r, max(color.g, color.b));
  
  // Smoothly key out black background and MP4 compression noise
  // < 0.06 is completely transparent
  // > 0.22 is fully opaque coin
  float alpha = smoothstep(0.06, 0.22, brightness);
  
  // Premultiplied alpha for seamless browser DOM compositing
  gl_FragColor = vec4(color.rgb * alpha, alpha);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export const WinVideoOverlay: React.FC<WinVideoOverlayProps> = ({
  src,
  onEnded,
  width = 1360,
  height = 768,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animId = 0;
    let isDisposed = false;

    // Initialize WebGL context with transparency
    const gl =
      canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true }) ||
      (canvas.getContext('experimental-webgl', {
        alpha: true,
        premultipliedAlpha: true,
      }) as WebGLRenderingContext | null);

    let program: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    let posBuffer: WebGLBuffer | null = null;
    let texBuffer: WebGLBuffer | null = null;

    if (gl) {
      const vs = createShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);

      if (vs && fs) {
        program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vs);
          gl.attachShader(program, fs);
          gl.linkProgram(program);

          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);

            // Setup fullscreen quad
            posBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([
                -1, -1,
                 1, -1,
                -1,  1,
                 1,  1,
              ]),
              gl.STATIC_DRAW
            );

            const aPos = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            // Setup texture coordinates (unflipped mapping)
            texBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([
                0, 0,
                1, 0,
                0, 1,
                1, 1,
              ]),
              gl.STATIC_DRAW
            );

            const aTex = gl.getAttribLocation(program, 'a_texCoord');
            gl.enableVertexAttribArray(aTex);
            gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

            // Setup video texture
            texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          }
        }
      }
    }

    const ctx2d = !gl ? canvas.getContext('2d') : null;

    const render = () => {
      if (isDisposed) return;

      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        if (gl && program && texture) {
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);

          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        } else if (ctx2d) {
          // 2D Fallback
          ctx2d.clearRect(0, 0, canvas.width, canvas.height);
          ctx2d.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }

      if (!video.paused && !video.ended) {
        animId = requestAnimationFrame(render);
      }
    };

    const handlePlay = () => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(render);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('timeupdate', handlePlay);

    video.currentTime = 0;
    video.play().catch(() => {});

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('timeupdate', handlePlay);
      video.pause();

      if (gl) {
        if (texture) gl.deleteTexture(texture);
        if (posBuffer) gl.deleteBuffer(posBuffer);
        if (texBuffer) gl.deleteBuffer(texBuffer);
        if (program) gl.deleteProgram(program);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      {/* Hidden offscreen video source to prevent throttle */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        onEnded={onEnded}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Real-time transparency canvas keyed by WebGL */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          left: 20,
          top: 170,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
