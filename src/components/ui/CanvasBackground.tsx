import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const fragmentShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uOpacity;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    
    // Dynamic organic movement
    float noise = sin(uv.x * 10.0 + uTime * 0.5) * cos(uv.y * 10.0 + uTime * 0.5);
    
    // Mouse influence
    float dist = distance(uv, uMouse);
    float glow = smoothstep(0.4, 0.0, dist) * 0.3;
    
    // 2026 Color Palette (Primary to Secondary flow)
    vec3 color1 = vec3(0.0, 0.47, 1.0); // Primary Blue
    vec3 color2 = vec3(0.5, 0.0, 1.0); // Secondary Purple
    
    vec3 finalColor = mix(color1, color2, uv.y + noise * 0.2);
    finalColor += glow;
    
    gl_FragColor = vec4(finalColor, uOpacity);
}
`;

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function BackgroundPlane({ opacity = 0.4 }: { opacity?: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const { size } = useThree();
    
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uOpacity: { value: opacity }
    }), []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const material = meshRef.current.material as THREE.ShaderMaterial;
        material.uniforms.uTime.value = state.clock.getElapsedTime();
        
        // Smoothly follow mouse
        const targetX = (state.mouse.x + 1) / 2;
        const targetY = (state.mouse.y + 1) / 2;
        material.uniforms.uMouse.value.x += (targetX - material.uniforms.uMouse.value.x) * 0.05;
        material.uniforms.uMouse.value.y += (targetY - material.uniforms.uMouse.value.y) * 0.05;
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                fragmentShader={fragmentShader}
                vertexShader={vertexShader}
                uniforms={uniforms}
                transparent
            />
        </mesh>
    );
}

export const CanvasBackground = () => {
    return (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-background">
            {/* Fallback CSS Aurora (SEO/Bot friendly) */}
            <div className="absolute inset-0 bg-aurora opacity-50 block md:hidden" />
            
            {/* High-fidelity WebGL Layer */}
            <div className="absolute inset-0 hidden md:block opacity-60 dark:opacity-40 transition-opacity duration-1000">
                <Canvas camera={{ position: [0, 0, 1] }}>
                    <BackgroundPlane />
                </Canvas>
            </div>
            
            {/* Grain/Texture Overlay */}
            <div className="absolute inset-0 opacity-[var(--grain-opacity)] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};
