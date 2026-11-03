// Name: Pixel Cover Interpolation + LCD Grid
// Author: antiKk
// Version: 1
//
// Uses pixel coverage to reduce uneven pixel widths when scaling
// to non-integer resolutions. A single bilinear sample is used
// to blend neighbouring texels.
//
// The LCD grid is applied after interpolation.
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
#pragma parameter shape "Edge Sharpness" 0.50 0.00 1.00 0.05
#pragma parameter brighten_scanlines "Brighten Scanlines" 16.00 1.00 32.00 0.50
#pragma parameter brighten_lcd "Brighten LCD" 4.00 1.00 12.00 0.10

uniform float softness;
uniform float shape;
uniform float brighten_scanlines;
uniform float brighten_lcd;

vec2 native_res() {
    return max(u_native_resolution, vec2(1.0));
}

vec2 clamp_uv(vec2 uv) {
    vec2 px = 0.5 / native_res();
    return clamp(uv, px, 1.0 - px);
}

void main() {
    const float PI = 3.141592654;

    highp vec2 native = native_res();
    highp vec2 out_res = max(u_resolution, vec2(1.0));

    // ---------------------------------------------------------
    // Pixel Cover Interpolation
    // ---------------------------------------------------------

    highp vec2 d = min(
        mix(native / out_res, vec2(1.0), softness),
        vec2(1.0)
    );

    highp vec2 t = v_uv * native;
    highp vec2 a = t - 0.5 * d;
    highp vec2 k = floor(t + 0.5 * d);

    highp vec2 wl = clamp((k - a) / d, 0.0, 1.0);

#ifdef USE_QUINTIC
    highp vec2 s = wl * wl * wl *
        (wl * (wl * 6.0 - 15.0) + 10.0);
#else
    highp vec2 s = wl * wl * (3.0 - 2.0 * wl);
#endif

    wl = mix(wl, s, shape);

    highp vec2 uv = (k + 0.5 - wl) / native;

    vec3 colour = texture2D(u_tex, clamp_uv(uv)).rgb;

    // ---------------------------------------------------------
    // LCD Grid
    // ---------------------------------------------------------

    vec2 angle =
        2.0 * PI * (fract(v_uv * native) - 0.25);

    float yfactor =
        (brighten_scanlines + sin(angle.y)) /
        (brighten_scanlines + 1.0);

    float xfactor =
        (brighten_lcd + sin(angle.x)) /
        (brighten_lcd + 1.0);

    colour *= yfactor * xfactor;

    gl_FragColor = vec4(colour, 1.0);
}