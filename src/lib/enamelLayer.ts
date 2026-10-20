// @ts-nocheck
// "Fridge enamel texture" as a fill layer, like the brushed steel: it draws the enamel's light and
// shadow on its own, to sit on top of a gradient, instead of re-shading the page under it. That
// needs only WebGPU, not the experimental HTML-in-Canvas the original effect relies on.
//
// The noise, height field and lighting are the Figma shader's, unchanged (see the original in
// custom-effects/CodeComponentId_8c552fed…, which stays as Figma exported it). Only the last step
// differs: the original lights the colour underneath (`source * (1 + relief)`); this outputs the relief
// as premultiplied black (shadow) or white (highlight) with the same strength, for the gradient
// below to show through.

const WGSL = `
diagnostic(off,derivative_uniformity);
struct Uniforms {
  dims: vec4f,     // width, height (physical px), renderScale, 0
  shape: vec4f,    // textureSize, bumpDepth, glossiness, lightDirection
  extra: vec4f,    // seed, blendStrength, 0, 0
};
@group(0) @binding(0) var<uniform> u: Uniforms;
struct VsIn { @location(0) pos: vec2f, @location(1) uv: vec2f };
struct VsOut { @builtin(position) position: vec4f, @location(0) uv: vec2f };

fn enamelHash(p: vec2f) -> f32 {
  var h = fract(vec3f(p.x, p.y, p.x) * 0.1031);
  h = h + dot(h, h.yzx + vec3f(33.33));
  return fract((h.x + h.y) * h.z);
}
fn enamelNoise(p: vec2f) -> f32 {
  let cell = floor(p);
  let f = fract(p);
  let w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(enamelHash(cell), enamelHash(cell + vec2f(1.0, 0.0)), w.x),
    mix(enamelHash(cell + vec2f(0.0, 1.0)), enamelHash(cell + vec2f(1.0, 1.0)), w.x), w.y);
}
fn enamelHeight(p: vec2f) -> f32 {
  let warp = vec2f(enamelNoise(p * 0.63 + vec2f(19.4, 8.1)),
    enamelNoise(p * 0.63 + vec2f(1.7, 43.8))) - vec2f(0.5);
  let q = p + warp * 0.95;
  let broad = enamelNoise(q * 1.65);
  let detail = enamelNoise(q * 3.7 + vec2f(8.3, 21.7));
  let field = broad * 0.82 + detail * 0.18;
  return smoothstep(0.15, 0.85, field) * 0.88
    + enamelNoise(q * 6.1 + vec2f(51.0, 4.0)) * 0.035;
}

@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

@fragment fn fs_main(in: VsOut) -> @location(0) vec4f {
  let dims = max(u.dims.xy, vec2f(1.0));
  let renderScale = max(u.dims.z, 0.0001);
  let textureSize = u.shape.x;
  let bumpDepth = u.shape.y;
  let glossiness = u.shape.z;
  let lightDirection = u.shape.w;
  let seed = u.extra.x;
  let blendStrength = clamp(u.extra.y, 0.0, 1.0);
  // Point-space geometry keeps pebble size and composition stable across raster scales.
  let seedOffset = vec2f(enamelHash(vec2f(seed, 17.0)), enamelHash(vec2f(39.0, seed))) * 128.0;
  let p = in.uv * dims / (max(textureSize, 0.5) * renderScale) + seedOffset;
  let e = 0.09;
  let h = enamelHeight(p);
  let dx = (enamelHeight(p + vec2f(e, 0.0)) - enamelHeight(p - vec2f(e, 0.0))) / (2.0 * e);
  let dy = (enamelHeight(p + vec2f(0.0, e)) - enamelHeight(p - vec2f(0.0, e))) / (2.0 * e);
  let n = normalize(vec3f(-dx * bumpDepth, -dy * bumpDepth, 1.0));
  let angle = lightDirection * 0.01745329252;
  let light = normalize(vec3f(cos(angle) * 0.8, sin(angle) * 0.8, 1.0));
  let diffuse = dot(n, light) - light.z;
  let halfVector = normalize(light + vec3f(0.0, 0.0, 1.0));
  let exponent = mix(14.0, 64.0, glossiness);
  let spec = pow(max(dot(n, halfVector), 0.0), exponent)
    - pow(max(halfVector.z, 0.0), exponent);
  let relief = diffuse * 0.33 + spec * glossiness * 0.085
    - max(0.34 - h, 0.0) * bumpDepth * 0.075;
  // shadow: darkens the colour below by the same amount as source * (1 + relief)
  if (relief < 0.0) {
    return vec4f(0.0, 0.0, 0.0, clamp(-relief * blendStrength, 0.0, 1.0));
  }
  // highlight: the original's lift plus its small additive sheen, as white
  let a = clamp(relief * 1.055 * blendStrength, 0.0, 1.0);
  return vec4f(a, a, a, a);
}
`

export function setup(device, frame) {
  frame.state.module = device.createShaderModule({ code: WGSL })
  frame.state.pipeline = null
  frame.state.pipelineFormat = null
  frame.state.quad = device.createBuffer({ size: 96, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true })
  new Float32Array(frame.state.quad.getMappedRange()).set([
    -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0,
    -1, 1, 0, 0, 1, -1, 1, 1, 1, 1, 1, 0,
  ])
  frame.state.quad.unmap()
  frame.state.uniformBuf = device.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
}

export function render(device, frame) {
  const params = frame.params || {}
  const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
  const width = Math.max(1, num(frame.output.physicalWidth, frame.output.width))
  const height = Math.max(1, num(frame.output.physicalHeight, frame.output.height))
  device.queue.writeBuffer(frame.state.uniformBuf, 0, new Float32Array([
    width, height, Math.max(0.0001, num(frame.renderScale, 1)), 0,
    num(params.textureSize, 3), num(params.bumpDepth, 0.45), num(params.glossiness, 0.35), num(params.lightDirection, 225),
    num(params.seed, 7), num(params.blendStrength, 0.75), 0, 0,
  ]))
  if (frame.state.pipeline == null || frame.state.pipelineFormat !== frame.output.format) {
    frame.state.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: frame.state.module,
        entryPoint: 'vs_main',
        buffers: [{ arrayStride: 16, attributes: [
          { shaderLocation: 0, format: 'float32x2', offset: 0 },
          { shaderLocation: 1, format: 'float32x2', offset: 8 },
        ] }],
      },
      fragment: { module: frame.state.module, entryPoint: 'fs_main', targets: [{ format: frame.output.format }] },
      primitive: { topology: 'triangle-list' },
    })
    frame.state.pipelineFormat = frame.output.format
  }
  const bindGroup = device.createBindGroup({
    layout: frame.state.pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: frame.state.uniformBuf } }],
  })
  const encoder = device.createCommandEncoder()
  const pass = encoder.beginRenderPass({ colorAttachments: [{
    view: frame.output.createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 0 },
  }] })
  pass.setPipeline(frame.state.pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.setVertexBuffer(0, frame.state.quad)
  pass.draw(6)
  pass.end()
  device.queue.submit([encoder.finish()])
}

export const manifest = {
  version: 2,
  name: 'Fridge enamel texture (layer)',
  isAnimated: false,
  usesMouse: false,
}
