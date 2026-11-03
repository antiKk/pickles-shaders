// Name: Pixel Cover Interpolation
// Author: antiKk
// Version: 3
//
// Uses pixel coverage to reduce uneven pixel widths when scaling
// to non-integer resolutions. A single bilinear sample is used
// to blend neighbouring texels.
//
// Softness controls the width of the sampling footprint:
//   0.00 = sharpest result
//   1.00 = conventional bilinear
//
// Edge Sharpness controls the shape of the blend:
//   0.00 = linear
//   1.00 = quintic (sharper transitions)
//
// REQUIRES LINEAR texture filtering.

#pragma parameter softness "Interpolation Softness" 0.25 0.00 1.00 0.05
#pragma parameter shape    "Edge Sharpness"         0.50 0.00 1.00 0.05

// Use the quintic curve instead of smoothstep.
#define USE_QUINTIC

uniform float softness;
uniform float shape;

vec2 native_res() {
    return max(u_native_resolution, vec2(1.0));
}

vec2 clamp_uv(vec2 uv) {
    vec2 px = 0.5 / native_res();
    return clamp(uv, px, 1.0 - px);
}

void main() {
    highp vec2 native  = native_res();
    highp vec2 out_res = max(u_resolution, vec2(1.0));

    // Box width in source texels, per axis.
    // min() keeps downscaling safe (falls back to plain bilinear).
    highp vec2 d = min(mix(native / out_res, vec2(1.0), softness), vec2(1.0));

    highp vec2 t = v_uv * native;       // sample centre in texel space
    highp vec2 a = t - 0.5 * d;         // box left/top edge
    highp vec2 k = floor(t + 0.5 * d);  // texel boundary the box crosses

    // Fraction of the box covered by the previous texel
    // (0 if the box does not cross a boundary).
    highp vec2 wl = clamp((k - a) / d, 0.0, 1.0);

    // Reshape the transition. Both curves are symmetric about 0.5,
    // so edge position and brightness are unaffected.
#ifdef USE_QUINTIC
    highp vec2 s = wl * wl * wl * (wl * (wl * 6.0 - 15.0) + 10.0);
#else
    highp vec2 s = wl * wl * (3.0 - 2.0 * wl);
#endif
    wl = mix(wl, s, shape);

    highp vec2 uv = (k + 0.5 - wl) / native;

    gl_FragColor = vec4(texture2D(u_tex, clamp_uv(uv)).rgb, 1.0);
}
