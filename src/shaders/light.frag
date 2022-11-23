precision highp float;

// #pragma glslify: dithering = require('./dithering.glsl')

uniform vec3 uLightPos;
uniform vec2 uMousePos;
uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform sampler2D uEnvironment;
uniform float uIridescence;
uniform sampler2D uCameraTexture;

void main() {

    vec2 uv = gl_FragCoord.xy / uResolution.xy;

    vec3 normal = normalize(texture2D( uTexture, uv ).xyz);

    vec3 reflectRay = reflect(vec3(uv, 1.0), normal);
    vec3 reflection = texture2D(uEnvironment, reflectRay.xy).rgb;

    vec3 viewPos = vec3( 0.0, 0.0, 1.5 );
    vec3 lightPos = uLightPos;
    vec3 fragPos = vec3( ( 2.0 * uv - 1.0 ), normal.z );

    vec3 worldPos = fragPos * 0.01; // scale down so we don't sample texture off screen
    vec3 eyeVector = normalize(worldPos - viewPos);

    vec3 refracted = refract( eyeVector, normal, 1.0/1.33 );
    uv += refracted.xy;
    vec3 refractedCamera = texture2D( uCameraTexture, uv ).rgb;

    vec3 light = normalize( lightPos - fragPos ) * 11.2;
    vec3 highlight = normalize( light + normalize( viewPos - fragPos ) );

    // diffuse lighting
    float diffuseBase = max( dot( normal, light ), 0.0 ) * 0.055;
    vec3 diffuse = vec3( diffuseBase );

    // blend in refracted camera view
    diffuse = mix( diffuse, refractedCamera, 0.8 );

    // blend in reflection
    diffuse = mix( diffuse, reflection, 0.09 );

    // specular highlights
    float specularBase = max(dot(normal, highlight), 0.0);
    float reflectivity = pow(specularBase, 30.0);
    vec3 specular = vec3(reflectivity * 0.7);

    vec3 col = diffuse + specular;

    // vec3 modNormal = vec3( mod(normal.x * 2.0 + diffuseBase, 1.0), mod(normal.y * 2.5 + diffuseBase, 1.0), mod(normal.z * 3.0 + diffuseBase, 1.0) );
    // float normalHighlight = (normal.r + normal.g);
    // modNormal *= normalHighlight * uIridescence;
    // col = mix(col, modNormal, 0.2);

    // gl_FragColor = vec4( dithering(col), 1.0 );
    gl_FragColor = vec4( col, 1.0 );

}