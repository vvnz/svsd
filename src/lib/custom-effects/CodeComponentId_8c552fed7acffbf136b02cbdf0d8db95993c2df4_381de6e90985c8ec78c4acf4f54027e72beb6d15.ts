// @ts-nocheck

// Property metadata is only used in Figma Design, so this is a no-op.
function defineProperties(
  _component: unknown,
  _properties: unknown,
): void {}

export default function Effect() { }
export function setup(device, frame) {
    var wgsl = `
diagnostic(off,derivative_uniformity);
struct Uniforms {
  frameData: vec4f,
  inputDimsData: vec4f,
  textureSize: vec4f,
  bumpDepth: vec4f,
  glossiness: vec4f,
  lightDirection: vec4f,
  seed: vec4f,
  blendStrength: vec4f,
};
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var inputTex: texture_2d<f32>;

struct VsIn {
  @location(0) pos: vec2f,
  @location(1) uv: vec2f,
};
struct VsOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

fn sampleInput(p: vec2f) -> vec4f {
  return textureSampleLevel(inputTex, samp, clamp(p, vec2f(0.0), vec2f(1.0)), 0.0);
}

// Like sampleInput but returns transparent (premultiplied zero) outside the
// input rect instead of repeating the edge texel.
fn sampleInputOrZero(p: vec2f) -> vec4f {
  let inside = step(vec2f(0.0), p) * step(p, vec2f(1.0));
  return sampleInput(p) * (inside.x * inside.y);
}

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

  // Smooth, fused irregular mounds rather than cellular edges or cracks.

  return smoothstep(0.15, 0.85, field) * 0.88

    + enamelNoise(q * 6.1 + vec2f(51.0, 4.0)) * 0.035;

}

@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

@fragment fn fs_main(@location(0) outputUv_in: vec2f) -> @location(0) vec4f {
  let time = u.frameData.x;
  let outputUv = outputUv_in;
  let dims = max(u.frameData.yz, vec2f(1.0));
  let inputDims = max(u.inputDimsData.xy, vec2f(1.0));
  let inputTexel = vec2f(1.0) / inputDims;
  let uv = outputUv;
  // texel and aspect are input-relative to match uv. Zoom fills rescale texel
  // alongside their uv redefinition below (see zoomLocal).
  let texel = inputTexel;
  let aspect = inputDims.x / max(inputDims.y, 1.0);
  let textureSize = u.textureSize.x;
  let bumpDepth = u.bumpDepth.x;
  let glossiness = u.glossiness.x;
  let lightDirection = u.lightDirection.x;
  let seed = u.seed.x;
  let blendStrength = u.blendStrength.x;
  let inputColor = sampleInput(uv);
  if (blendStrength <= 0.0) { return inputColor; }
  let renderScale = max(u.frameData.w, 0.0001);
  let seedOffset = vec2f(enamelHash(vec2f(seed, 17.0)), enamelHash(vec2f(39.0, seed))) * 128.0;
  // Point-space geometry keeps pebble size and composition stable across raster scales.
  let p = uv * dims / (max(textureSize, 0.5) * renderScale) + seedOffset;
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
  let alpha = inputColor.a;
  let source = inputColor.rgb / max(alpha, 0.00001);
  let lit = clamp(source * (1.0 + relief) + vec3f(max(relief, 0.0) * 0.055), vec3f(0.0), vec3f(1.0));
  return vec4f(mix(inputColor.rgb, lit * alpha, clamp(blendStrength, 0.0, 1.0)), alpha);
}
`;
    frame.state.module = device.createShaderModule({ code: wgsl });
    frame.state.pipeline = null;
    frame.state.pipelineFormat = null;
    frame.state.quad = device.createBuffer({
        size: 6 * 4 * 4,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });
    new Float32Array(frame.state.quad.getMappedRange()).set([
        -1, -1, 0, 1,
        1, -1, 1, 1,
        -1, 1, 0, 0,
        -1, 1, 0, 0,
        1, -1, 1, 1,
        1, 1, 1, 0,
    ]);
    frame.state.quad.unmap();
    frame.state.uniformBuf = device.createBuffer({
        size: 128,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    frame.state.sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    });
    frame.state.placeholder = device.createTexture({
        size: [1, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture({ texture: frame.state.placeholder }, new Uint8Array([0, 0, 0, 0]), { bytesPerRow: 4 }, { width: 1, height: 1, depthOrArrayLayers: 1 });
}
export function render(device, frame) {
    var params = frame.params || {};
    function finiteNumber(value, fallback) {
        var num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }
    function numberParam(name, fallback) {
        return finiteNumber(params[name], fallback);
    }
    function boolParam(name, fallback) {
        if (typeof params[name] === 'boolean')
            return params[name] ? 1 : 0;
        return fallback ? 1 : 0;
    }
    function selectParam(name, count, fallbackIndex) {
        // A select is a numeric dropdown: params[name] is the chosen option's index.
        var index = Math.round(Number(params[name]));
        return Number.isFinite(index) && index >= 0 && index < count ? index : fallbackIndex;
    }
    function colorParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.r, fallback[0]),
            finiteNumber(value.g, fallback[1]),
            finiteNumber(value.b, fallback[2]),
            finiteNumber(value.a, fallback[3]),
        ];
    }
    function pointParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
        ];
    }
    function pointRadiusParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            finiteNumber(value.radius, fallback[2]),
        ];
    }
    function pointPointLineParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            finiteNumber(value.x2, fallback[2]),
            finiteNumber(value.y2, fallback[3]),
        ];
    }
    function pointAngleRadiusParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            finiteNumber(value.radius, fallback[2]),
            finiteNumber(value.angle, fallback[3]),
        ];
    }
    function colorPointParam(name, fallback) {
        var value = params[name] || {};
        var color = value.color || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            0,
            0,
            finiteNumber(color.r, fallback[2]),
            finiteNumber(color.g, fallback[3]),
            finiteNumber(color.b, fallback[4]),
            finiteNumber(color.a, fallback[5]),
        ];
    }
    function gradientParam(name, fallback) {
        var value = params[name] || {};
        var stops = Array.isArray(value.stops) && value.stops.length > 0 ? value.stops : fallback;
        // Layout: 8 stop colors (rgba), then 8 positions packed 4-per-vec4, then the live count.
        var out = new Array(44).fill(0);
        var count = Math.min(stops.length, 8);
        for (var i = 0; i < count; i++) {
            var stop = stops[i] || {};
            var color = stop.color || {};
            out[i * 4] = finiteNumber(color.r, 0);
            out[i * 4 + 1] = finiteNumber(color.g, 0);
            out[i * 4 + 2] = finiteNumber(color.b, 0);
            out[i * 4 + 3] = finiteNumber(color.a, 1);
            out[32 + i] = finiteNumber(stop.position, 0);
        }
        out[40] = count;
        return out;
    }
    var output = frame.output || {};
    var width = Math.max(1, finiteNumber(output.physicalWidth, finiteNumber(output.width, 1)));
    var height = Math.max(1, finiteNumber(output.physicalHeight, finiteNumber(output.height, 1)));
    var renderScale = Math.max(0.0001, finiteNumber(frame.renderScale, 1));
    var time = 0;
    var inputWidth = width;
    var inputHeight = height;
    device.queue.writeBuffer(frame.state.uniformBuf, 0, new Float32Array([
        time, width, height, renderScale,
        inputWidth, inputHeight, 0, 0,
        numberParam("textureSize", 3), 0, 0, 0,
        numberParam("bumpDepth", 0.45), 0, 0, 0,
        numberParam("glossiness", 0.35), 0, 0, 0,
        numberParam("lightDirection", 225), 0, 0, 0,
        numberParam("seed", 7), 0, 0, 0,
        numberParam("blendStrength", 0.75), 0, 0, 0,
    ]));
    var inputView = frame.input != null
        ? frame.input.createView()
        : frame.state.placeholder.createView();
    var outputFormat = frame.output.format;
    if (frame.state.pipeline == null || frame.state.pipelineFormat !== outputFormat) {
        frame.state.pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: frame.state.module,
                entryPoint: 'vs_main',
                buffers: [{
                        arrayStride: 16,
                        attributes: [
                            { shaderLocation: 0, format: 'float32x2', offset: 0 },
                            { shaderLocation: 1, format: 'float32x2', offset: 8 },
                        ],
                    }],
            },
            fragment: {
                module: frame.state.module,
                entryPoint: 'fs_main',
                targets: [{ format: outputFormat }],
            },
            primitive: { topology: 'triangle-list' },
        });
        frame.state.pipelineFormat = outputFormat;
    }
    var bindGroup = device.createBindGroup({
        layout: frame.state.pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: frame.state.uniformBuf } },
            { binding: 1, resource: frame.state.sampler },
            { binding: 2, resource: inputView },
        ],
    });
    var encoder = device.createCommandEncoder();
    var pass = encoder.beginRenderPass({
        colorAttachments: [{
                view: frame.output.createView(),
                loadOp: 'clear',
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                storeOp: 'store',
            }],
    });
    pass.setPipeline(frame.state.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, frame.state.quad);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
}
defineProperties(Effect, {
    "textureSize": {
        type: "number",
        label: "Texture size",
        defaultValue: 3,
        control: "slider",
        min: 1,
        max: 12,
        step: 0.1,
        unit: "px",
    },
    "bumpDepth": {
        type: "number",
        label: "Bump depth",
        defaultValue: 0.45,
        control: "slider",
        min: 0,
        max: 1,
        step: 0.01,
    },
    "glossiness": {
        type: "number",
        label: "Glossiness",
        defaultValue: 0.35,
        control: "slider",
        min: 0,
        max: 1,
        step: 0.01,
    },
    "lightDirection": {
        type: "number",
        label: "Light direction",
        defaultValue: 225,
        control: "slider",
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
    },
    "seed": {
        type: "number",
        label: "Seed",
        defaultValue: 7,
        control: "input",
        min: 0,
        max: 10000,
        step: 1,
    },
    "blendStrength": {
        type: "number",
        label: "Blend strength",
        defaultValue: 0.75,
        control: "slider",
        min: 0,
        max: 1,
        step: 0.01,
    },
});

export const manifest = {
  "version": 2,
  "name": "Fridge enamel texture",
  "isAnimated": false,
  "usesMouse": false
}
