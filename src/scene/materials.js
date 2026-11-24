import * as THREE from 'three'

// The page's seven org tints (see tokens.css), as solid colours. Each facet
// takes one, washed thinly over the page colour, so the cat reads as a
// patchwork print in the same palette as the chips.
const PALETTE = ['#a78bfa', '#fb923c', '#f472b6', '#60a5fa', '#34d399', '#22d3ee', '#facc15']

// The faces: the page colour, a soft wash of one palette colour per facet, and
// a faint ink tone in three flat steps, like a pencil shading pass. The
// darkest step gets diagonal hatching at a fixed on-screen pitch, as on a
// section drawing. The colours are uniforms, so the cat follows the page theme.
export function makeFillMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBg: { value: new THREE.Color() },
      uInk: { value: new THREE.Color() },
      uTone: { value: 1 }, // 0..1, fades the shading back to the page colour
      uWash: { value: 0 }, // how strongly each facet takes its palette colour
      uPal: { value: PALETTE.map((c) => new THREE.Color(c)) },
      uDpr: { value: 1 },
      uLight: { value: new THREE.Vector3(-0.55, 0.7, 0.45).normalize() }, // view space
    },
    vertexShader: /* glsl */ `
      varying vec3 vView;
      varying vec3 vObj;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = mv.xyz;
        vObj = position;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBg;
      uniform vec3 uInk;
      uniform float uTone;
      uniform float uDpr;
      uniform vec3 uLight;
      uniform float uWash;
      uniform vec3 uPal[7];
      varying vec3 vView;
      varying vec3 vObj;
      void main() {
        // Flat facet normal from screen derivatives: the low-poly look, no seams.
        vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
        float l = dot(n, uLight);
        float band = l > 0.45 ? 0.0 : (l > -0.05 ? 1.0 : 2.0);
        float tone = (0.035 + band * 0.045) * uTone;

        // The facet's colour, picked by its normal in the model's own space,
        // so each facet keeps its colour however the cat turns.
        vec3 on = normalize(cross(dFdx(vObj), dFdy(vObj)));
        float h = fract(sin(dot(floor(on * 6.0 + 0.5), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float k = floor(h * 7.0);
        vec3 tint = uPal[0];
        if (k > 0.5) tint = uPal[1];
        if (k > 1.5) tint = uPal[2];
        if (k > 2.5) tint = uPal[3];
        if (k > 3.5) tint = uPal[4];
        if (k > 4.5) tint = uPal[5];
        if (k > 5.5) tint = uPal[6];

        vec3 col = mix(uBg, tint, uWash * min(uTone, 1.0));
        col = mix(col, uInk, tone);
        if (band > 1.5) {
          // 45 degree lines 5 CSS px apart, measured across the lines.
          float s = (gl_FragCoord.x + gl_FragCoord.y) / (uDpr * 1.41421356);
          float d = abs(fract(s / 5.0) - 0.5) * 5.0; // px to the nearest hatch line
          float line = 1.0 - smoothstep(0.3, 1.0, d);
          col = mix(col, uInk, line * 0.16 * uTone);
        }
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
    polygonOffset: true, // pushes the faces back so the edges on them win the depth test
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    toneMapped: false,
  })
}

// The shadow: a halftone ellipse of dots on the floor. The dot grid is fixed
// in world space; only each dot's radius follows the cat's height, so the
// shadow breathes as the cat floats.
export function makeDotShadowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uInk: { value: new THREE.Color() },
      uOpacity: { value: 0 },
      uRadius: { value: new THREE.Vector2(0.42, 0.3) },
      uCell: { value: 0.04 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vXZ = w.xz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      uniform float uOpacity;
      uniform vec2 uRadius;
      uniform float uCell;
      varying vec2 vXZ;
      void main() {
        vec2 p = vXZ / uCell;
        vec2 cell = floor(p) + 0.5;
        vec2 g = p - cell;
        float r = length(cell * uCell / uRadius);
        if (r > 1.0) discard;
        float fill = 1.0 - smoothstep(0.1, 1.0, r);
        float radius = 0.38 * sqrt(fill);
        float d = length(g);
        float aa = fwidth(d);
        // Dots shrink toward the rim and fade as they get too small to draw.
        float a = (1.0 - smoothstep(radius - aa, radius + aa, d)) * smoothstep(0.0, 0.35, fill);
        if (a < 0.01) discard;
        gl_FragColor = vec4(uInk, a * uOpacity);
        #include <colorspace_fragment>
      }
    `,
  })
}
