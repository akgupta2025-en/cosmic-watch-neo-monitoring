import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Asteroid } from '../api/nasa';

interface PlanetProps {
  size: number;
  distance: number;
  speed: number;
  color: string;
  name: string;
  hasRings?: boolean;
  planetType?: 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
}

// Cache for generated textures
const textureCache = new Map<string, THREE.Texture>();

// Create realistic planet textures based on NASA imagery
function createPlanetTexture(planetType: 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune'): THREE.Texture {
  // Check cache first
  if (textureCache.has(planetType)) {
    return textureCache.get(planetType)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  if (planetType === 'mercury') {
    // Gray cratered surface - highly detailed
    const baseGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    baseGradient.addColorStop(0, '#A0A0A0');
    baseGradient.addColorStop(0.3, '#898989');
    baseGradient.addColorStop(0.5, '#787878');
    baseGradient.addColorStop(0.7, '#898989');
    baseGradient.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add detailed craters
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 80 + 5;
      
      const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      craterGradient.addColorStop(0, 'rgba(100,100,100,0.6)');
      craterGradient.addColorStop(0.4, 'rgba(120,120,120,0.3)');
      craterGradient.addColorStop(0.7, 'rgba(150,150,150,0.1)');
      craterGradient.addColorStop(1, 'rgba(160,160,160,0)');
      ctx.fillStyle = craterGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add surface texture
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(${120 + Math.random() * 40},${120 + Math.random() * 40},${120 + Math.random() * 40},${Math.random() * 0.15})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
  } else if (planetType === 'venus') {
    // Thick yellow-orange atmosphere with cloud patterns
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FFE4C4');
    gradient.addColorStop(0.2, '#FFD700');
    gradient.addColorStop(0.4, '#FFA500');
    gradient.addColorStop(0.5, '#FF8C00');
    gradient.addColorStop(0.6, '#FFA500');
    gradient.addColorStop(0.8, '#FFD700');
    gradient.addColorStop(1, '#FFE4C4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add swirling cloud patterns
    for (let i = 0; i < 40; i++) {
      const y = (i / 40) * canvas.height;
      const waveAmplitude = 60 + Math.random() * 120;
      ctx.strokeStyle = `rgba(${250 - i * 2},${180 - i * 1},0,${0.2 + Math.random() * 0.3})`;
      ctx.lineWidth = 60 + Math.random() * 80;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 40) {
        const offsetY = y + Math.sin((x / canvas.width) * Math.PI * 2 + i * 0.3) * waveAmplitude + Math.sin(i * 0.5) * 30;
        if (x === 0) ctx.moveTo(x, offsetY);
        else ctx.lineTo(x, offsetY);
      }
      ctx.stroke();
    }
  } else if (planetType === 'earth') {
    // Realistic Earth with oceans, continents, and clouds
    ctx.fillStyle = '#1E90FF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add continents with realistic shapes
    const continents = [
      { x: 0.15, y: 0.35, rx: 0.12, ry: 0.18, color: '#228B22' }, // North America
      { x: 0.05, y: 0.55, rx: 0.08, ry: 0.12, color: '#2E8B57' }, // South America
      { x: 0.35, y: 0.32, rx: 0.1, ry: 0.15, color: '#3CB371' }, // Europe/Africa
      { x: 0.65, y: 0.4, rx: 0.12, ry: 0.18, color: '#228B22' }, // Asia
      { x: 0.8, y: 0.6, rx: 0.08, ry: 0.1, color: '#2E8B57' }, // Australia
    ];
    
    continents.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.ellipse(c.x * canvas.width, c.y * canvas.height, c.rx * canvas.width, c.ry * canvas.height, Math.random() * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Add cloud coverage with multiple layers
    for (let layer = 0; layer < 2; layer++) {
      ctx.fillStyle = `rgba(255,255,255,${0.4 - layer * 0.15})`;
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 100 + 30;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Add polar ice caps
    ctx.fillStyle = 'rgba(220,220,255,0.9)';
    ctx.fillRect(0, 0, canvas.width, 60);
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // Add atmospheric glow
    const atmGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    atmGradient.addColorStop(0, 'rgba(100,200,255,0.3)');
    atmGradient.addColorStop(0.5, 'rgba(100,200,255,0)');
    atmGradient.addColorStop(1, 'rgba(100,200,255,0.3)');
    ctx.fillStyle = atmGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (planetType === 'mars') {
    // Red Mars with craters, dust storms, polar regions
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#E07B39');
    gradient.addColorStop(0.2, '#CD5C5C');
    gradient.addColorStop(0.4, '#C76B42');
    gradient.addColorStop(0.5, '#B85C3C');
    gradient.addColorStop(0.6, '#C76B42');
    gradient.addColorStop(0.8, '#CD5C5C');
    gradient.addColorStop(1, '#E07B39');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add Syrtis Major-like dark region
    const darkRegion = ctx.createRadialGradient(600, 450, 100, 600, 450, 300);
    darkRegion.addColorStop(0, 'rgba(80,40,20,0.8)');
    darkRegion.addColorStop(0.5, 'rgba(120,60,40,0.4)');
    darkRegion.addColorStop(1, 'rgba(140,70,50,0)');
    ctx.fillStyle = darkRegion;
    ctx.beginPath();
    ctx.arc(600, 450, 300, 0, Math.PI * 2);
    ctx.fill();

    // Add craters
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 70 + 8;
      const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      craterGradient.addColorStop(0, 'rgba(40,20,10,0.5)');
      craterGradient.addColorStop(0.6, 'rgba(100,50,30,0.2)');
      craterGradient.addColorStop(1, 'rgba(200,100,60,0)');
      ctx.fillStyle = craterGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add polar ice caps
    ctx.fillStyle = 'rgba(200,180,160,0.8)';
    ctx.fillRect(0, 0, canvas.width, 100);
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // Add dust/noise texture
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(${150 + Math.random() * 60},${100 + Math.random() * 40},${50 + Math.random() * 30},${Math.random() * 0.2})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
  } else if (planetType === 'jupiter') {
    // Giant gas planet with detailed cloud bands and Great Red Spot
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FFE4A6');
    gradient.addColorStop(0.15, '#F0D080');
    gradient.addColorStop(0.3, '#D4A960');
    gradient.addColorStop(0.45, '#8B6F47');
    gradient.addColorStop(0.5, '#654321');
    gradient.addColorStop(0.55, '#8B6F47');
    gradient.addColorStop(0.7, '#D4A960');
    gradient.addColorStop(0.85, '#F0D080');
    gradient.addColorStop(1, '#FFE4A6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add turbulent cloud bands
    for (let i = 0; i < 35; i++) {
      const y = (i / 35) * canvas.height;
      const bandHeight = 20 + Math.random() * 40;
      const bandColor = i % 3 === 0 ? 'rgba(220,160,60,0.3)' : i % 3 === 1 ? 'rgba(100,80,40,0.25)' : 'rgba(180,140,80,0.3)';
      
      ctx.strokeStyle = bandColor;
      ctx.lineWidth = bandHeight;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 80) {
        const offsetY = y + 
          Math.sin((x / canvas.width) * Math.PI * 4 + i * 0.5) * 25 +
          Math.sin((x / canvas.width) * Math.PI * 2 + i) * 20 +
          Math.random() * 15;
        if (x === 0) ctx.moveTo(x, offsetY);
        else ctx.lineTo(x, offsetY);
      }
      ctx.stroke();
    }

    // Add Great Red Spot
    const spotX = 1200, spotY = 500;
    const spotGradient = ctx.createRadialGradient(spotX, spotY, 50, spotX, spotY, 180);
    spotGradient.addColorStop(0, 'rgba(220,100,50,0.9)');
    spotGradient.addColorStop(0.5, 'rgba(180,80,40,0.6)');
    spotGradient.addColorStop(0.8, 'rgba(140,60,30,0.2)');
    spotGradient.addColorStop(1, 'rgba(100,50,30,0)');
    ctx.fillStyle = spotGradient;
    ctx.beginPath();
    ctx.ellipse(spotX, spotY, 180, 110, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Add storm detail inside the spot
    ctx.strokeStyle = 'rgba(255,150,100,0.4)';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.ellipse(spotX, spotY, 130, 70, -0.3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (planetType === 'saturn') {
    // Pale golden Saturn
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FFF8DC');
    gradient.addColorStop(0.2, '#F5DEB3');
    gradient.addColorStop(0.4, '#EDD5B1');
    gradient.addColorStop(0.5, '#DAA520');
    gradient.addColorStop(0.6, '#EDD5B1');
    gradient.addColorStop(0.8, '#F5DEB3');
    gradient.addColorStop(1, '#FFF8DC');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle atmospheric bands
    for (let i = 0; i < 20; i++) {
      const y = (i / 20) * canvas.height;
      ctx.strokeStyle = `rgba(${200 + Math.random() * 30},${150 + Math.random() * 30},${80 + Math.random() * 30},${0.08 + Math.random() * 0.12})`;
      ctx.lineWidth = 40 + Math.random() * 60;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 60) {
        const offsetY = y + Math.sin((x / canvas.width) * Math.PI * 3 + i * 0.2) * 20;
        if (x === 0) ctx.moveTo(x, offsetY);
        else ctx.lineTo(x, offsetY);
      }
      ctx.stroke();
    }
  } else if (planetType === 'uranus') {
    // Cyan-blue ice giant with methane atmosphere
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#6DB3E8');
    gradient.addColorStop(0.3, '#4FA3D1');
    gradient.addColorStop(0.5, '#1E90FF');
    gradient.addColorStop(0.7, '#4FA3D1');
    gradient.addColorStop(1, '#6DB3E8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add methane cloud bands
    for (let i = 0; i < 15; i++) {
      const y = (i / 15) * canvas.height;
      ctx.strokeStyle = `rgba(${100 + Math.random() * 80},${180 + Math.random() * 50},${255},${0.12 + Math.random() * 0.18})`;
      ctx.lineWidth = 50 + Math.random() * 70;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 100) {
        const offsetY = y + Math.sin((x / canvas.width) * Math.PI * 2 + i * 0.3) * 25;
        if (x === 0) ctx.moveTo(x, offsetY);
        else ctx.lineTo(x, offsetY);
      }
      ctx.stroke();
    }

    // Add subtle storm systems
    for (let i = 0; i < 3; i++) {
      const stormX = Math.random() * canvas.width;
      const stormY = Math.random() * canvas.height;
      const stormGradient = ctx.createRadialGradient(stormX, stormY, 30, stormX, stormY, 120);
      stormGradient.addColorStop(0, 'rgba(150,230,255,0.2)');
      stormGradient.addColorStop(1, 'rgba(100,150,255,0)');
      ctx.fillStyle = stormGradient;
      ctx.beginPath();
      ctx.arc(stormX, stormY, 120, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (planetType === 'neptune') {
    // Deep blue ice giant with storms
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4DA6FF');
    gradient.addColorStop(0.25, '#2E7FD1');
    gradient.addColorStop(0.5, '#000080');
    gradient.addColorStop(0.75, '#2E7FD1');
    gradient.addColorStop(1, '#4DA6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add cloud bands and wind patterns
    for (let i = 0; i < 22; i++) {
      const y = (i / 22) * canvas.height;
      ctx.strokeStyle = `rgba(${120 + Math.random() * 80},${170 + Math.random() * 50},${255},${0.15 + Math.random() * 0.2})`;
      ctx.lineWidth = 35 + Math.random() * 60;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 80) {
        const wave1 = Math.sin((x / canvas.width) * Math.PI * 3 + i * 0.2) * 30;
        const wave2 = Math.sin((x / canvas.width) * Math.PI * 1.5 + i * 0.5) * 20;
        const offsetY = y + wave1 + wave2 + Math.random() * 10;
        if (x === 0) ctx.moveTo(x, offsetY);
        else ctx.lineTo(x, offsetY);
      }
      ctx.stroke();
    }

    // Add Great Dark Spot
    const spotX = 1600, spotY = 550;
    const spotGradient = ctx.createRadialGradient(spotX, spotY, 50, spotX, spotY, 150);
    spotGradient.addColorStop(0, 'rgba(0,0,80,0.7)');
    spotGradient.addColorStop(0.6, 'rgba(20,40,120,0.3)');
    spotGradient.addColorStop(1, 'rgba(50,80,150,0)');
    ctx.fillStyle = spotGradient;
    ctx.beginPath();
    ctx.ellipse(spotX, spotY, 150, 90, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.needsUpdate = true;
  
  // Cache the texture
  textureCache.set(planetType, texture);
  
  return texture;
}

function Planet({ size, distance, speed, color, hasRings, planetType }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  
  // Memoize texture so it doesn't recreate on every render
  const texture = useMemo(() => {
    if (planetType) {
      return createPlanetTexture(planetType);
    }
    return null;
  }, [planetType]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = clock.getElapsedTime() * speed;
    if (sphereRef.current) {
      sphereRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[distance, 0, 0]} ref={sphereRef}>
        <sphereGeometry args={[size, 128, 128]} />
        {texture ? (
          <meshPhongMaterial map={texture} emissive={color} emissiveIntensity={0.15} shininess={50} />
        ) : (
          <meshPhongMaterial color={color} emissive={color} emissiveIntensity={0.3} shininess={30} />
        )}
      </mesh>

      {/* Rings for Saturn */}
      {hasRings && (
        <mesh position={[distance, 0, 0]} rotation={[Math.PI * 0.35, 0, 0]}>
          <ringGeometry args={[size * 1.8, size * 3.2, 128, 1]} />
          <meshPhongMaterial
            color="#C4A876"
            emissive="#8B7355"
            emissiveIntensity={0.2}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <lineSegments>
        <bufferGeometry attach="geometry">
          <bufferAttribute args={[getOrbitPath(distance), 3]} attach="attributes-position" />
        </bufferGeometry>
        <lineBasicMaterial color={color} opacity={0.2} transparent />
      </lineSegments>
    </group>
  );
}

function getOrbitPath(radius: number) {
  const points: number[] = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(radius * Math.cos(angle), 0, radius * Math.sin(angle));
  }
  return new Float32Array(points);
}

function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.005;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.002;
    }
  });

  return (
    <group>
      {/* Sun core */}
      <mesh ref={sunRef} position={[0, 0, 0]}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>

      {/* Sun glow layer 1 */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshBasicMaterial color="#FDB813" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Sun glow layer 2 */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial color="#FF8C00" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>

      <pointLight intensity={3} distance={300} color="#FDB813" />
    </group>
  );
}

interface AsteroidParticleProps {
  position: [number, number, number];
  size: number;
  color: string;
  name: string;
}

function AsteroidParticle({ position, size, color }: AsteroidParticleProps) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += Math.random() * 0.02;
      ref.current.rotation.y += Math.random() * 0.02;
    }
  });

  return (
    <mesh 
      ref={ref} 
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      scale={hovered ? 1.5 : 1}
    >
      <octahedronGeometry args={[size]} />
      <meshPhongMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.8 : 0.3} />
    </mesh>
  );
}

interface EarthProps {
  asteroids: Asteroid[];
}

function EarthSystem({ asteroids }: EarthProps) {
  const earthGroupRef = useRef<THREE.Group>(null);
  const [asteroidPositions, setAsteroidPositions] = useState<Array<{
    position: [number, number, number];
    size: number;
    color: string;
    name: string;
  }>>([]);

  useEffect(() => {
    const positions = asteroids.slice(0, 50).map((ast) => {
      const distance = 50 + Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 15;
      
      const color = ast.is_potentially_hazardous_asteroid ? '#FF4444' : '#44FF44';
      
      return {
        position: [
          distance * Math.cos(angle),
          height,
          distance * Math.sin(angle),
        ] as [number, number, number],
        size: 0.3 + Math.random() * 0.2,
        color,
        name: ast.name,
      };
    });
    setAsteroidPositions(positions);
  }, [asteroids]);

  useFrame(({ clock }) => {
    if (!earthGroupRef.current) return;
    earthGroupRef.current.rotation.z = clock.getElapsedTime() * 0.2;
  });

  return (
    <group ref={earthGroupRef}>
      {/* Earth */}
      <mesh position={[50, 0, 0]}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshPhongMaterial 
          color="#4489F4" 
          emissive="#2266FF" 
          emissiveIntensity={0.3}
          shininess={50}
        />
      </mesh>

      {/* Earth orbit */}
      <lineSegments>
        <bufferGeometry attach="geometry">
          <bufferAttribute args={[getOrbitPath(50), 3]} attach="attributes-position" />
        </bufferGeometry>
        <lineBasicMaterial color="#4489F4" opacity={0.3} transparent />
      </lineSegments>

      {/* Asteroids */}
      {asteroidPositions.map((ast, i) => (
        <AsteroidParticle key={i} {...ast} />
      ))}
    </group>
  );
}

interface Scene3DProps {
  asteroids: Asteroid[];
}

function Scene3D({ asteroids }: Scene3DProps) {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 50, 100]} fov={60} />
      <OrbitControls autoRotate autoRotateSpeed={0.25} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={1.8} color="#FDB813" />

      {/* Background stars */}
      <Stars radius={400} depth={150} count={10000} factor={8} saturation={0} fade={true} speed={0.3} />

      {/* Solar system - All 8 planets with realistic textures */}
      <Sun />
      
      {/* Inner planets */}
      <Planet size={0.38} distance={20} speed={0.018} color="#8B7355" name="Mercury" planetType="mercury" />
      <Planet size={0.95} distance={32} speed={0.011} color="#E8C48C" name="Venus" planetType="venus" />
      <Planet size={1.0} distance={50} speed={0.0084} color="#4489F4" name="Earth" planetType="earth" />
      <Planet size={0.53} distance={65} speed={0.0063} color="#E27B58" name="Mars" planetType="mars" />

      {/* Outer gas giants */}
      <Planet size={2.2} distance={95} speed={0.0041} color="#DAA520" name="Jupiter" planetType="jupiter" />
      <Planet size={1.8} distance={130} speed={0.0027} color="#F4A460" name="Saturn" hasRings={true} planetType="saturn" />
      <Planet size={1.5} distance={160} speed={0.0018} color="#4FD0E7" name="Uranus" planetType="uranus" />
      <Planet size={1.4} distance={190} speed={0.0014} color="#4169E1" name="Neptune" planetType="neptune" />

      {/* Earth system with asteroids */}
      <EarthSystem asteroids={asteroids} />

      {/* Asteroid belt */}
      <AsteroidBelt />
    </Canvas>
  );
}

function AsteroidBelt() {
  useFrame(() => {});

  return (
    <group>
      {Array.from({ length: 200 }).map((_, i) => {
        const angle = (i / 200) * Math.PI * 2 + Math.random() * 0.2;
        const distance = 75 + Math.random() * 15;
        const height = (Math.random() - 0.5) * 25;
        
        return (
          <mesh key={i} position={[distance * Math.cos(angle), height, distance * Math.sin(angle)]}>
            <octahedronGeometry args={[0.08 + Math.random() * 0.12]} />
            <meshPhongMaterial 
              color="#CCCCCC" 
              emissive="#666666" 
              emissiveIntensity={0.1}
              shininess={15}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function Orrery3D({ asteroids }: Scene3DProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-space-700/50 shadow-2xl">
      <Scene3D asteroids={asteroids} />
    </div>
  );
}
