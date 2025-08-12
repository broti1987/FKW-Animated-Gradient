import * as THREE from "three";

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);

// --- Camera ---
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

// --- Scene ---
const scene = new THREE.Scene();

// --- Uniforms ---
const uniforms = {
  u_time: { value: 0.0 },
  u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
};

let startTime = performance.now();
let lastSize = new THREE.Vector2(window.innerWidth, window.innerHeight);

// --- Resize ---
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  uniforms.u_resolution.value.set(w, h);
  startTime = performance.now();

  
}
window.addEventListener("resize", resize);
resize();

// --- Shaders ---
const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform float u_time;
  uniform vec2 u_resolution;

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5,183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        uv *= 1.2;
    float t = u_time * 0.1;

    float r1 = noise(uv * 0.5 + t * 0.2);
    float r2 = noise(uv * 0.75 - t * 0.15);
    float r3 = noise(uv * 1.0 + t * 0.1);
    float redBlend = smoothstep(0.35, 0.75, ((r1 + r2 + r3) / 3.0) * 0.5 + 0.5);

    float b1 = noise((uv + vec2(0.2, -0.3)) * 0.6 - t * 0.12);
    float b2 = noise((uv + vec2(-0.4, 0.1)) * 0.8 + t * 0.18);
    float b3 = noise((uv + vec2(0.3, 0.2)) * 1.0 - t * 0.09);
    float blueBlend = smoothstep(0.35, 0.75, ((b1 + b2 + b3) / 3.0) * 0.5 + 0.5);

    float y1 = noise((uv + vec2(0.5, -0.2)) * 0.4 + t * 0.07);
    float y2 = noise((uv + vec2(-0.3, 0.4)) * 0.45 - t * 0.05);
    float yellowBlend = smoothstep(0.45, 0.7, ((y1 + y2) / 2.0) * 0.5 + 0.5);

    vec3 c1 = vec3(0.980, 0.961, 0.941);  // #FAF5F0
    vec3 c2 = vec3(0.940, 0.995, 1.000);  // #F0FEFF
    vec3 c3 = vec3(1.000, 0.932, 0.880);  // #FFEDE0
    vec3 c4 = vec3(0.940, 0.995, 1.000);  // #F0FEFF
    vec3 c5 = vec3(1.000, 0.932, 0.880);  // #FFEDE0
    vec3 c6 = vec3(1.000, 0.932, 0.880);  // duplicate of c3

    vec3 color = mix(c1, c2, smoothstep(0.0, 0.3, redBlend));
    color = mix(color, c3, smoothstep(0.2, 0.6, redBlend));
    color = mix(color, c5, smoothstep(0.7, 1.0, redBlend));

    color = mix(color, c4, blueBlend);
    color = mix(color, c6, yellowBlend);

    float grain = noise(gl_FragCoord.xy * 4.0 + vec2(sin(u_time * 2.0), cos(u_time * 3.0)) * 20.0) * 0.05;
    color = mix(color, color * (1.0 - grain), 0.15);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
});

let mesh = null;
function createPlane() {
  const geometry = new THREE.PlaneGeometry(2, 2);
  if (mesh) scene.remove(mesh);
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}
createPlane();

// --- Animate ---
function animate(time) {
  requestAnimationFrame(animate);

  const w = window.innerWidth;
  const h = window.innerHeight;

  if (w !== lastSize.x || h !== lastSize.y) {
    lastSize.set(w, h);
    renderer.setSize(w, h);
    uniforms.u_resolution.value.set(w, h);
    startTime = performance.now();
  }

  uniforms.u_time.value = (time - startTime) * 0.025;
  renderer.render(scene, camera);
}
animate();
