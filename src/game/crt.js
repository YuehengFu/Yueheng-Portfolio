// WebGL post-process that turns the low-res game canvas into a CRT image:
// barrel curvature, one scanline per game pixel row, phosphor bloom, a touch
// of chromatic fringing and a vignette. Returns null when WebGL is missing so
// the caller can fall back to showing the source canvas directly.

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_src;
uniform vec3 u_bg;
varying vec2 v_uv;

vec2 curve(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 off = abs(uv.yx) / vec2(7.0, 5.5);
  uv += uv * off * off;
  return uv * 0.5 + 0.5;
}

vec3 tap(vec2 uv) { return texture2D(u_tex, uv).rgb; }

void main() {
  vec2 uv = curve(v_uv);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(u_bg * 0.6, 1.0);
    return;
  }
  vec2 px = 1.0 / u_src;

  // Chromatic fringing: red and blue sampled a fraction of a pixel apart.
  vec3 col = vec3(
    tap(uv + vec2(px.x * 0.3, 0.0)).r,
    tap(uv).g,
    tap(uv - vec2(px.x * 0.3, 0.0)).b
  );

  // Phosphor bloom from two rings of neighbours, subtracting the ground so
  // only lit pixels glow.
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    vec2 d = vec2(cos(a), sin(a));
    glow += max(tap(uv + d * px * 1.5) - u_bg, 0.0) * 0.6;
    glow += max(tap(uv + d * px * 3.5) - u_bg, 0.0) * 0.4;
  }
  col += glow * 0.09;

  // One scanline per game pixel row.
  float row = fract(uv.y * u_src.y);
  col *= mix(0.62, 1.0, sin(row * 3.14159));

  // Vignette toward the curved edges.
  vec2 v = uv - 0.5;
  col *= 1.0 - dot(v, v) * 0.75;

  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

const hexToRgb = (hex) => {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  return m ? m.slice(1).map((h) => parseInt(h, 16) / 255) : [0.03, 0.03, 0.05];
};

export function createCrt(output, source, bgHex) {
  const gl = output.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Nearest sampling keeps the game pixels hard-edged under the effect.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const uSrc = gl.getUniformLocation(prog, "u_src");
  const uBg = gl.getUniformLocation(prog, "u_bg");
  let bg = hexToRgb(bgHex);

  return {
    setBackground(hex) {
      bg = hexToRgb(hex);
    },
    render() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(output.clientWidth * dpr);
      const h = Math.round(output.clientHeight * dpr);
      if (!w || !h || !source.width) return;
      if (output.width !== w || output.height !== h) {
        output.width = w;
        output.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
      gl.uniform2f(uSrc, source.width, source.height);
      gl.uniform3f(uBg, bg[0], bg[1], bg[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    destroy() {
      // The context is left alive on purpose: a remount (StrictMode, hot
      // reload) asks the same canvas for it again.
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    },
  };
}
