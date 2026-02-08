import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface Asteroid3DProps {
  size: number;
  hazardous: boolean;
  asteroid?: {
    id: string;
    name: string;
    close_approach_data: Array<{
      close_approach_date: string;
      relative_velocity: {
        kilometers_per_hour: string;
      };
      miss_distance: {
        kilometers: string;
      };
    }>;
  };
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      {/* Earth */}
      <mesh ref={earthRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial color="#4489F4" emissive="#2266FF" emissiveIntensity={0.3} />
      </mesh>

      {/* Earth glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial
          color="#4489F4"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Orbital plane reference */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={64} array={getOrbitalRing()} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#64B5F6" opacity={0.3} transparent />
      </lineSegments>
    </group>
  );
}

function getOrbitalRing() {
  const points: number[] = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(15 * Math.cos(angle), 0, 15 * Math.sin(angle));
  }
  return new Float32Array(points);
}

interface AsteroidMeshProps extends Asteroid3DProps {
  position: [number, number, number];
}

function AsteroidMesh({ size, hazardous, position }: AsteroidMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.LineSegments>(null);

  const scale = Math.max(0.3, Math.min(1.5, size));

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.015;
      meshRef.current.rotation.y += 0.02;
    }
    if (glowRef.current && hazardous) {
      glowRef.current.scale.setScalar(1.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15);
    }
    if (trailRef.current) {
      trailRef.current.rotation.z += 0.01;
    }
  });

  return (
    <group position={position}>
      {/* Orbital trail */}
      <lineSegments ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={32} array={getAsteroidTrail()} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={hazardous ? '#FF4444' : '#44FF44'} opacity={0.5} transparent />
      </lineSegments>

      {/* Asteroid */}
      <mesh ref={meshRef} castShadow receiveShadow scale={scale}>
        <dodecahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color={hazardous ? '#8B4545' : '#5A6270'}
          roughness={0.7}
          metalness={0.3}
          flatShading
        />
      </mesh>

      {/* Glow effect */}
      {hazardous && (
        <mesh ref={glowRef} scale={scale * 1.3}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color="#FF3366"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Distance indicator lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={hazardous ? '#FF6666' : '#66FF66'} opacity={0.6} transparent linewidth={2} />
      </lineSegments>
    </group>
  );
}

function getAsteroidTrail() {
  const points: number[] = [];
  for (let i = 0; i <= 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const radius = 0.8;
    points.push(radius * Math.cos(angle), radius * Math.sin(angle) * 0.3, radius * Math.sin(angle));
  }
  return new Float32Array(points);
}

interface OrbitalPathProps extends Asteroid3DProps {
  asteroidCount: number;
}

function OrbitalPath({ hazardous, asteroidCount }: OrbitalPathProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.0003;
    }
  });

  // Generate asteroid positions along an elliptical path
  const asteroids = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < asteroidCount; i++) {
      const angle = (i / asteroidCount) * Math.PI * 2;
      const x = 12 * Math.cos(angle);
      const z = 8 * Math.sin(angle);
      const y = Math.sin(angle * 2) * 3;
      positions.push([x, y, z]);
    }
    return positions;
  }, [asteroidCount]);

  return (
    <group ref={groupRef}>
      {asteroids.map((pos, idx) => (
        <AsteroidMesh 
          key={idx} 
          size={0.2} 
          hazardous={hazardous}
          position={pos}
        />
      ))}
    </group>
  );
}

export default function Asteroid3D({ size, hazardous, asteroid }: Asteroid3DProps) {
  const closeApproachCount = asteroid?.close_approach_data?.length || 1;

  return (
    <div className="w-full h-full cursor-move">
      <Canvas camera={{ position: [0, 8, 25], fov: 50 }}>
        <color attach="background" args={['#0B0E14']} />
        
        {/* Environment */}
        <Stars radius={200} depth={100} count={5000} factor={5} saturation={0} fade speed={0.5} />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={1.2} 
          color={hazardous ? "#FFE4E1" : "#E0FFFF"} 
        />
        <pointLight position={[-10, -10, -10]} intensity={0.4} color="#8A2BE2" />
        <pointLight position={[0, 0, 0]} intensity={0.3} color="#4489F4" />

        {/* Cosmic background haze */}
        <mesh position={[0, 0, -50]} scale={100}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial color="#1A1A2E" transparent opacity={0.3} />
        </mesh>

        {/* Earth */}
        <Earth />

        {/* Primary asteroid */}
        <AsteroidMesh 
          size={size} 
          hazardous={hazardous}
          position={[12, 0, 8]}
        />

        {/* Orbital trajectory trail */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute 
              attach="attributes-position" 
              count={64} 
              array={getTrajectoryPath()} 
              itemSize={3} 
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={hazardous ? '#FF6666' : '#66FF66'} 
            opacity={0.6} 
            transparent 
            linewidth={2}
          />
        </lineSegments>

        {/* Related asteroids in close approach sequence */}
        <OrbitalPath 
          size={size} 
          hazardous={hazardous}
          asteroidCount={Math.min(closeApproachCount, 8)}
        />
        
        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          autoRotate={true}
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}

function getTrajectoryPath() {
  const points: number[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    // Bezier curve from Earth to asteroid approach point
    const x = (1 - t) * 0 + t * 12;
    const y = Math.sin(t * Math.PI) * 4;
    const z = (1 - t) * 0 + t * 8;
    points.push(x, y, z);
  }
  return new Float32Array(points);
}
