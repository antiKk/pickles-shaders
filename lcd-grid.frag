// Name: LCD Grid
// Author: antiKk
// Version: 3

// Port of the RetroArch 'lcd1x' shader by jdgleaver

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

    vec2 angle = 2.0 * PI * (fract(v_uv * native_res()) - 0.25);

    float yfactor = (brighten_scanlines + sin(angle.y)) / (brighten_scanlines + 1.0);
    float xfactor = (brighten_lcd + sin(angle.x)) / (brighten_lcd + 1.0);

    vec3 colour = texture2D(u_tex, snap_uv(v_uv)).rgb;

    colour = yfactor * xfactor * colour;

    gl_FragColor = vec4(colour, 1.0);
}
