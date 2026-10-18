// @ts-nocheck

// Property metadata is only used in Figma Design, so this is a no-op.
function defineProperties(
  _component: unknown,
  _properties: unknown,
): void {}

export default function Effect() { }
export function setup(device, frame) {
    frame.state.module = device.createShaderModule({ code: `
diagnostic(off,derivative_uniformity);
struct Uniforms {
  dimensions: vec4f,
  material: vec4f,
  steelTint: vec4f,
};
@group(0) @binding(0) var<uniform> u: Uniforms;
struct VsIn { @location(0) pos: vec2f, @location(1) uv: vec2f };
struct VsOut { @builtin(position) position: vec4f, @location(0) uv: vec2f };
fn hash(p: vec2f) -> f32 {
  var q = fract(vec3f(p.x, p.y, p.x) * 0.1031);
  q = q + dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
fn noise(p: vec2f) -> f32 {
  let cell = floor(p);
  let f = fract(p);
  let w = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(cell), hash(cell + vec2f(1.0, 0.0)), w.x),
    mix(hash(cell + vec2f(0.0, 1.0)), hash(cell + vec2f(1.0, 1.0)), w.x), w.y);
}
fn band(x: f32, center: f32, width: f32) -> f32 {
  let d = (x - center) / width;
  return exp(-d * d * 0.5);
}
@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}
@fragment fn fs_main(in: VsOut) -> @location(0) vec4f {
  // Point-space brushing preserves physical proportions and render-scale invariance.
  let sizePt = u.dimensions.xy / u.dimensions.z;
  let p = (in.uv - vec2f(0.5)) * sizePt / u.dimensions.w;
  let footprint = max(fwidth(p.y), 0.001);
  let brush = u.material.x;
  let reflection = u.material.y;
  let scratchStrength = u.material.z;
  let exposure = u.material.w;
  // Broad nonperiodic vertical reflected lights, not radial or cylindrical shading.
  let x = in.uv.x + 0.008 * (noise(vec2f(in.uv.y * 1.2, 73.0)) - 0.5);
  let light = 0.14 * band(x, 0.24, 0.12)
    + 0.11 * band(x, 0.76, 0.16)
    - 0.075 * band(x, 0.49, 0.105)
    - 0.09 * band(x, -0.08, 0.13)
    - 0.075 * band(x, 1.06, 0.10);
  var value = 0.71 + reflection * light;
  // Long horizontal fibers at fine scales, without coarse isotropic grain.
  let fineWeight = 1.0 / (1.0 + pow(footprint / 0.60, 2.0));
  let fine = noise(vec2f(p.x / 21.0, p.y / 0.60) + 51.0) - 0.5;
  let medium = noise(vec2f(p.x / 47.0, p.y / 1.25) + 17.0) - 0.5;
  let longFiber = noise(vec2f(p.x / 95.0, p.y / 2.7) + 93.0) - 0.5;
  value = value + brush * (0.075 * fine * fineWeight + 0.035 * medium + 0.014 * longFiber);
  // Independent hairline lengths, tapered ends, random row offsets and analytic coverage.
  let cellSize = vec2f(128.0, 3.1);
  let base = floor(p / cellSize);
  var scratches = 0.0;
  for (var row = -1; row <= 1; row = row + 1) {
    for (var col = -1; col <= 1; col = col + 1) {
      let id = base + vec2f(f32(col), f32(row));
      let r = hash(id + 11.2);
      let r2 = hash(id + 91.7);
      let center = (id + vec2f(r, r2)) * cellSize;
      let halfLength = 9.0 + 72.0 * hash(id + 37.4);
      let dx = abs(p.x - center.x);
      let taper = 1.0 - smoothstep(halfLength * 0.65, halfLength, dx);
      let width = 0.045 + 0.11 * hash(id + 19.1);
      let dy = abs(p.y - center.y);
      let coverage = (1.0 - smoothstep(max(0.0, width - footprint * 0.5),
        width + footprint * 0.5, dy)) * min(1.0, 2.0 * width / footprint);
      let signValue = select(-1.0, 0.7, r > 0.65);
      scratches = scratches + signValue * coverage * taper;
    }
  }
  value = clamp((value + scratchStrength * 0.065 * scratches) * exposure, 0.0, 1.0);
  // Straight-alpha fill output.
  return vec4f(clamp(value * u.steelTint.rgb, vec3f(0.0), vec3f(1.0)), u.steelTint.a);
}
` });
    frame.state.pipeline = null;
    frame.state.pipelineFormat = null;
    frame.state.quad = device.createBuffer({
        size: 96, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true,
    });
    new Float32Array(frame.state.quad.getMappedRange()).set([
        -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0,
        -1, 1, 0, 0, 1, -1, 1, 1, 1, 1, 1, 0,
    ]);
    frame.state.quad.unmap();
    frame.state.uniformBuf = device.createBuffer({
        size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
}
export function render(device, frame) {
    var params = frame.params || {};
    function number(value, fallback) {
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    }
    var tint = params.steelTint || { r: 1, g: 1, b: 1, a: 1 };
    var width = Math.max(1, number(frame.output.physicalWidth, frame.output.width));
    var height = Math.max(1, number(frame.output.physicalHeight, frame.output.height));
    device.queue.writeBuffer(frame.state.uniformBuf, 0, new Float32Array([
        width, height, Math.max(0.01, number(frame.renderScale, 1)),
        Math.max(0.1, number(params.zoom, 1)),
        number(params.brushing, 0.8), number(params.reflection, 1),
        number(params.scratches, 0.65), number(params.brightness, 1),
        number(tint.r, 1), number(tint.g, 1), number(tint.b, 1), number(tint.a, 1),
    ]));
    if (frame.state.pipeline == null || frame.state.pipelineFormat !== frame.output.format) {
        frame.state.pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: frame.state.module, entryPoint: 'vs_main',
                buffers: [{ arrayStride: 16, attributes: [
                            { shaderLocation: 0, format: 'float32x2', offset: 0 },
                            { shaderLocation: 1, format: 'float32x2', offset: 8 },
                        ] }],
            },
            fragment: {
                module: frame.state.module, entryPoint: 'fs_main',
                targets: [{ format: frame.output.format }],
            },
            primitive: { topology: 'triangle-list' },
        });
        frame.state.pipelineFormat = frame.output.format;
    }
    var bindGroup = device.createBindGroup({
        layout: frame.state.pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: frame.state.uniformBuf } }],
    });
    var encoder = device.createCommandEncoder();
    var pass = encoder.beginRenderPass({ colorAttachments: [{
                view: frame.output.createView(), loadOp: 'clear', storeOp: 'store',
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
            }] });
    pass.setPipeline(frame.state.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, frame.state.quad);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
}
defineProperties(Effect, {
    steelTint: {
        type: 'color', label: 'Steel tint',
        defaultValue: { r: 1, g: 1, b: 1, a: 1 },
    },
    brushing: {
        type: 'number', label: 'Brushing', defaultValue: 0.8,
        control: 'slider', min: 0, max: 2, step: 0.01,
    },
    reflection: {
        type: 'number', label: 'Reflected light', defaultValue: 1,
        control: 'slider', min: 0, max: 2, step: 0.01,
    },
    scratches: {
        type: 'number', label: 'Hairline scratches', defaultValue: 0.65,
        control: 'slider', min: 0, max: 2, step: 0.01,
    },
    brightness: {
        type: 'number', label: 'Brightness', defaultValue: 1,
        control: 'slider', min: 0.5, max: 1.3, step: 0.01,
    },
    zoom: {
        type: 'number', label: 'Scale', defaultValue: 1,
        control: 'slider', min: 0.1, max: 5, step: 0.01,
    },
});

export const manifest = {
  "version": 2,
  "name": "Wind vortex",
  "isAnimated": false,
  "usesMouse": false
}
