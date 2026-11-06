// Name: LCD Grid RGB
// Author: antiKk
// Version: 1

// Similar goal to the RetroArch 'lcd3x' shader by Gigaherz
// Uses a scanline alignment akin to my LCD Grid shader based on the 'lcd1x' shader by jdgleaver 
// RGB subpixels centred within each native pixel
// Native-resolution pixel snapping for sharp scaling

#pragma parameter brighten_scanlines "Brighten Scanlines" 16.00 1.00 32.00 0.50
#pragma parameter brighten_lcd "Brighten LCD" 4.00 1.00 12.00 0.10

uniform float brighten_scanlines;
uniform float brighten_lcd;

vec2 native_res() {
    return max(u_native_resolution, vec2(1.0));
}

vec2 clamp_uv(vec2 uv) {
    vec2 px = 0.5 / native_res();
    return clamp(uv, px, 1.0 - px);
}

vec2 snap_uv(vec2 uv) {
    vec2 n = native_res();
    return clamp_uv((floor(uv * n) + 0.5) / n);
}

void main() {
    const float PI = 3.141592654;
    // R, G, B stripe centres within each source pixel
    const vec3 SUBPIXEL = vec3(1.0 / 6.0, 0.5, 5.0 / 6.0);

    vec2 f = fract(v_uv * native_res());

    float yfactor = (brighten_scanlines + sin(2.0 * PI * (f.y - 0.25))) / (brighten_scanlines + 1.0);
    vec3 xfactors = (brighten_lcd + cos(2.0 * PI * (f.x - SUBPIXEL))) / (brighten_lcd + 1.0);

    vec3 colour = texture2D(u_tex, snap_uv(v_uv)).rgb;

    gl_FragColor = vec4(yfactor * xfactors * colour, 1.0);
}