// Name: Pixel Cover LCD Grid RGB
// Author: antiKk
// Version: 1
//
// Single-pass combination of:
//   - Pixel Cover Interpolation (v3)
//   - LCD Grid RGB (v1)
//
// Pixel Cover Interpolation:
// Uses pixel coverage to reduce uneven pixel widths when scaling
// to non-integer resolutions. A single bilinear sample is used
// to blend neighbouring texels.
//
// LCD Grid RGB:
// Similar goal to the RetroArch 'lcd3x' shader by Gigaherz
// Uses a scanline alignment akin to my LCD Grid shader based on the 'lcd1x' shader by jdgleaver 
// RGB subpixels centred within each native pixel
// Native-resolution pixel snapping for sharp scaling
//
// REQUIRES LINEAR texture filtering.

#pragma parameter softness           "Interpolation Softness" 0.25  0.00 1.00 0.05
#pragma parameter shape              "Edge Sharpness"         0.50  0.00 1.00 0.05
#pragma parameter brighten_scanlines "Brighten Scanlines"     16.00 1.00 32.00 0.50
#pragma parameter brighten_lcd       "Brighten LCD"           4.00  1.00 12.00 0.10

// Use the quintic curve instead of smoothstep.
#define USE_QUINTIC

uniform float softness;
uniform float shape;
uniform float brighten_scanlines;
uniform float brighten_lcd;

vec2 native_res() {
    return max(u_native_resolution, vec2(1.0));
}

void main() {
    // -------------------------------------------------
    // 1. Pixel coverage interpolation (full precision)
    // -------------------------------------------------

    highp vec2 native  = native_res();
    highp vec2 out_res = max(u_resolution, vec2(1.0));

    // Box width in source texels, per axis.
    // min() keeps downscaling safe (falls back to bilinear).
    highp vec2 d = min(mix(native / out_res, vec2(1.0), softness), vec2(1.0));

    highp vec2 t = v_uv * native;          // sample centre in texel space
    highp vec2 a = t - 0.5 * d;            // box left/top edge
    highp vec2 k = floor(t + 0.5 * d);     // texel boundary the box crosses

    // Fraction of the box covered by the previous texel.
    highp vec2 wl = clamp((k - a) / d, 0.0, 1.0);

    // Reshape the transition. Both curves are symmetric about 0.5,
    // so edge position and brightness are unaffected.
#ifdef USE_QUINTIC
    highp vec2 s = wl * wl * wl * (wl * (wl * 6.0 - 15.0) + 10.0);
#else
    highp vec2 s = wl * wl * (3.0 - 2.0 * wl);
#endif
    wl = mix(wl, s, shape);

    highp vec2 px = 0.5 / native;
    highp vec2 uv = clamp((k + 0.5 - wl) / native, px, 1.0 - px);

    vec3 colour = texture2D(u_tex, uv).rgb;

    // -------------------------------------------------
    // 2. LCD RGB grid (identical to LCD Grid RGB v1)
    // -------------------------------------------------

    const float PI = 3.141592654;
    // R, G, B stripe centres within each source pixel
    const vec3 SUBPIXEL = vec3(1.0 / 6.0, 0.5, 5.0 / 6.0);

    vec2 f = fract(v_uv * native_res());

    float yfactor = (brighten_scanlines + sin(2.0 * PI * (f.y - 0.25))) / (brighten_scanlines + 1.0);
    vec3 xfactors = (brighten_lcd + cos(2.0 * PI * (f.x - SUBPIXEL))) / (brighten_lcd + 1.0);

    gl_FragColor = vec4(yfactor * xfactors * colour, 1.0);
}
