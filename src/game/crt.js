// WebGL post-process that turns the low-res game canvas into a CRT image:
// barrel curvature, one scanline per game pixel row, phosphor bloom, a touch
// of chromatic fringing and a vignette. Returns null when WebGL is missing so
// the caller can fall back to showing the source canvas directly.
//
// The GPU can drop the context at any time (a phone backgrounding the tab, a
// driver reset). onLost fires so the caller can show the 2D canvas instead;
// every GL object is rebuilt when the browser hands the context back, and
// onRestored fires so the caller can switch the tube back on.

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

vec3 lit(vec2 uv) { return max(tap(uv) - u_bg, 0.0); }

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

  // Phosphor bloom from one ring of 8 neighbours 1.5 game pixels out,
  // subtracting the ground so only lit pixels glow. Each tap weighs 1.0, the
  // same total per direction as the old two rings (0.6 + 0.4), so the glow is
  // as bright for 11 texture reads a pixel instead of 19. At 2px the ring
  // printed a hard second outline round each sprite; 1.5 keeps the old soft
  // halo. Constant offsets: no cos/sin per pixel.
  vec3 glow = lit(uv + vec2( 1.5,  0.0) * px)
            + lit(uv + vec2( 1.06,  1.06) * px)
            + lit(uv + vec2( 0.0,  1.5) * px)
            + lit(uv + vec2(-1.06,  1.06) * px)
            + lit(uv + vec2(-1.5,  0.0) * px)
            + lit(uv + vec2(-1.06, -1.06) * px)
            + lit(uv + vec2( 0.0, -1.5) * px)
            + lit(uv + vec2( 1.06, -1.06) * px);
  col += glow * 0.09;

  // One scanline per game pixel row.
  float row = fract(uv.y * u_src.y);
  col *= mix(0.62, 1.0, sin(row * 3.14159));

  // Vignette toward the curved edges.
  vec2 v = uv - 0.5;
  col *= 1.0 - dot(v, v) * 0.75;

  gl_FragColor = vec4(col, 1.0);
}`;

// On desktop one scanline is a game row of 4 CSS px, which a 1x backing
// store already resolves; past 1.25 the extra fragments only heat the GPU (a
// Retina laptop hero has ~2.5x fewer at 1.25 than at 2). Phones draw a game
// row in 2 CSS px, where 1.25 leaves 2.5 device px per scanline and the
// lines smear, so the cap rises just enough to keep 4 device px per row.
const MAX_DPR = 1.25;
const MIN_PX_PER_ROW = 4;

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

// Builds the program, quad and texture on a live context. Returns null if
// any step fails (no shader support, or the context died mid-build).
function build(gl) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  // The linked program keeps its own copy; the shader objects can go.
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
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

  return {
    prog,
    buf,
    tex,
    uSrc: gl.getUniformLocation(prog, "u_src"),
    uBg: gl.getUniformLocation(prog, "u_bg"),
  };
}

export function createCrt(output, source, bgHex, { onLost, onRestored } = {}) {
  const gl = output.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl || gl.isContextLost()) return null;

  let res = build(gl);
  if (!res) return null;
  let bg = hexToRgb(bgHex);

  // preventDefault tells the browser we can rebuild, which is what makes it
  // fire webglcontextrestored later.
  const handleLost = (e) => {
    e.preventDefault();
    res = null;
    onLost?.();
  };
  const handleRestored = () => {
    res = build(gl);
    // A failed rebuild leaves the 2D canvas showing, which is still a
    // working hero.
    if (res) onRestored?.();
  };
  output.addEventListener("webglcontextlost", handleLost);
  output.addEventListener("webglcontextrestored", handleRestored);

  return {
    setBackground(hex) {
      bg = hexToRgb(hex);
    },
    render() {
      if (!res || !source.width || !source.height) return;
      const cssPerRow = output.clientHeight / source.height;
      const cap = Math.max(MAX_DPR, MIN_PX_PER_ROW / cssPerRow);
      const dpr = Math.min(window.devicePixelRatio || 1, cap);
      const w = Math.round(output.clientWidth * dpr);
      const h = Math.round(output.clientHeight * dpr);
      if (!w || !h) return;
      if (output.width !== w || output.height !== h) {
        output.width = w;
        output.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
      gl.uniform2f(res.uSrc, source.width, source.height);
      gl.uniform3f(res.uBg, bg[0], bg[1], bg[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    destroy() {
      output.removeEventListener("webglcontextlost", handleLost);
      output.removeEventListener("webglcontextrestored", handleRestored);
      // The context is left alive on purpose: a remount (StrictMode, hot
      // reload) asks the same canvas for it again.
      if (res) {
        gl.deleteTexture(res.tex);
        gl.deleteBuffer(res.buf);
        gl.deleteProgram(res.prog);
        res = null;
      }
    },
  };
}
