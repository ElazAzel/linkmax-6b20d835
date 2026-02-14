import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, Box } from '@react-three/drei';
import * as THREE from 'three';

function GlassSphere({ position, scale = 1, speed = 1 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position} scale={scale}>
        <MeshDistortMaterial
          color="#8b5cf6"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.7}
        />
      </Sphere>
    </Float>
  );
}

function GlassTorus({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={0.8}>
      <Torus ref={meshRef} args={[1, 0.3, 32, 100]} position={position} scale={scale}>
        <MeshDistortMaterial
          color="#3b82f6"
          attach="material"
          distort={0.3}
          speed={3}
          roughness={0.2}
          metalness={0.9}
          transparent
          opacity={0.6}
        />
      </Torus>
    </Float>
  );
}

function GlassBox({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.4;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.6;
    }
  });

  return (
    <Float speed={1} rotationIntensity={1} floatIntensity={0.6}>
      <Box ref={meshRef} args={[1, 1, 1]} position={position} scale={scale}>
        <MeshDistortMaterial
          color="#ec4899"
          attach="material"
          distort={0.2}
          speed={2}
          roughness={0.15}
          metalness={0.85}
          transparent
          opacity={0.65}
        />
      </Box>
    </Float>
  );
}

function FloatingParticles() {
  const count = 50;
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      const scale = Math.random() * 0.05 + 0.02;
      temp.push({ position, scale });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      particles.forEach((particle, i) => {
        const matrix = new THREE.Matrix4();
        const y = particle.position.y + Math.sin(state.clock.elapsedTime + i) * 0.01;
        matrix.setPosition(particle.position.x, y, particle.position.z);
        matrix.scale(new THREE.Vector3(particle.scale, particle.scale, particle.scale));
        mesh.current!.setMatrixAt(i, matrix);
      });
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#8b5cf6" transparent opacity={0.4} />
    </instancedMesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
      <spotLight position={[0, 10, 0]} intensity={0.8} color="#ec4899" angle={0.3} />
      
      <GlassSphere position={[-2, 0.5, 0]} scale={0.8} speed={1.2} />
      <GlassSphere position={[2.5, -0.5, -1]} scale={0.5} speed={0.8} />
      <GlassTorus position={[1.5, 1, -2]} scale={0.6} />
      <GlassBox position={[-1.5, -1, -1]} scale={0.5} />
      <GlassBox position={[0, 0.5, -3]} scale={0.3} />
      
      <FloatingParticles />
    </>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 opacity-60 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
