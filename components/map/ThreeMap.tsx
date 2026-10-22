"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { MapPlaceRow } from "@/lib/supabase/types";
import { GROUND_CONFIG, CATEGORY_CONFIG, CAMPUS_FEATURES } from "@/lib/map-config";

interface ThreeMapProps {
  places: MapPlaceRow[];
  selectedPlace: MapPlaceRow | null;
  onSelectPlace: (place: MapPlaceRow | null) => void;
  filteredCategory: string;
}

/**
 * Camera controller smoothly interpolating OrbitControls target when a place is selected.
 */
function CameraController({
  selectedPlace,
  controlsRef,
}: {
  selectedPlace: MapPlaceRow | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (selectedPlace) {
      const desiredTarget = new THREE.Vector3(
        selectedPlace.position_x,
        0,
        selectedPlace.position_z,
      );
      currentTarget.current.lerp(desiredTarget, Math.min(delta * 4, 1));
      controlsRef.current.target.copy(currentTarget.current);
    }

    controlsRef.current.target.x = THREE.MathUtils.clamp(
      controlsRef.current.target.x,
      -42,
      42,
    );
    controlsRef.current.target.z = THREE.MathUtils.clamp(
      controlsRef.current.target.z,
      -42,
      42,
    );
    controlsRef.current.target.y = 0;
    controlsRef.current.update();
  });

  return null;
}

/**
 * Low-poly Campus Ground Plane with walkways, lawns, and entrance.
 */
function Ground() {
  const { width, depth, groundColor, pavementColor, lawnColor, borderRingColor } =
    GROUND_CONFIG;

  return (
    <group>
      {/* Base campus terrain slab */}
      <mesh receiveShadow position={[0, -0.4, 0]}>
        <boxGeometry args={[width, 0.8, depth]} />
        <meshStandardMaterial color={groundColor} roughness={0.9} />
      </mesh>

      {/* Campus perimeter boundary line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[42, 42.6, 64]} />
        <meshBasicMaterial color={borderRingColor} opacity={0.6} transparent />
      </mesh>

      {/* Main North-South pathway */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[6, 80]} />
        <meshStandardMaterial color={pavementColor} roughness={0.8} />
      </mesh>

      {/* East-West cross pathway */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.011, 0]}
        receiveShadow
      >
        <planeGeometry args={[80, 6]} />
        <meshStandardMaterial color={pavementColor} roughness={0.8} />
      </mesh>

      {/* Central circular plaza */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.012, 0]}
        receiveShadow
      >
        <circleGeometry args={[14, 32]} />
        <meshStandardMaterial color={pavementColor} roughness={0.8} />
      </mesh>

      {/* Manicured green lawn patches */}
      {CAMPUS_FEATURES.lawns.map((lawn, idx) => (
        <mesh
          key={idx}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[lawn.x, 0.015, lawn.z]}
          receiveShadow
        >
          <planeGeometry args={[lawn.w, lawn.d]} />
          <meshStandardMaterial color={lawnColor} roughness={0.95} />
        </mesh>
      ))}

      {/* South main entrance gate archway */}
      <group position={[CAMPUS_FEATURES.entrance.x, 0, CAMPUS_FEATURES.entrance.z]}>
        {/* Left pillar */}
        <mesh position={[-4, 2, 0]}>
          <boxGeometry args={[0.7, 4, 0.7]} />
          <meshStandardMaterial color="#6a5e7b" />
        </mesh>
        {/* Right pillar */}
        <mesh position={[4, 2, 0]}>
          <boxGeometry args={[0.7, 4, 0.7]} />
          <meshStandardMaterial color="#6a5e7b" />
        </mesh>
        {/* Crossbeam arch */}
        <mesh position={[0, 4.2, 0]}>
          <boxGeometry args={[9, 0.6, 0.9]} />
          <meshStandardMaterial color="#5a45d6" />
        </mesh>
      </group>

      {/* Low-poly campus trees */}
      {CAMPUS_FEATURES.trees.map((tree, idx) => (
        <Tree key={idx} position={[tree.x, 0, tree.z]} scale={1 + (idx % 3) * 0.15} />
      ))}
    </group>
  );
}

/**
 * Stylized low-poly tree model.
 */
function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 1.6, 6]} />
        <meshStandardMaterial color="#6e5a4d" roughness={0.9} />
      </mesh>
      {/* Lower foliage cone */}
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[1.4, 2, 6]} />
        <meshStandardMaterial color="#7a9379" roughness={0.8} />
      </mesh>
      {/* Upper foliage cone */}
      <mesh position={[0, 3.4, 0]}>
        <coneGeometry args={[1.0, 1.8, 6]} />
        <meshStandardMaterial color="#8ba58a" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * 3D Model for a Stage place.
 */
function StageModel({ isHovered, isSelected }: { isHovered: boolean; isSelected: boolean }) {
  const accentColor = CATEGORY_CONFIG.stage.color;
  const hoverColor = CATEGORY_CONFIG.stage.hoverColor;
  const activeColor = isSelected ? hoverColor : isHovered ? hoverColor : accentColor;

  return (
    <group>
      {/* Raised circular platform */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[4.2, 4.6, 0.8, 16]} />
        <meshStandardMaterial
          color={isSelected ? "#45329f" : "#2f2648"}
          roughness={0.6}
        />
      </mesh>

      {/* Center performance stage surface */}
      <mesh position={[0, 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.8, 16]} />
        <meshStandardMaterial color={activeColor} roughness={0.4} />
      </mesh>

      {/* Stage backdrop / acoustic sound shell */}
      <mesh position={[0, 2.2, 2.4]}>
        <boxGeometry args={[5.2, 2.8, 0.3]} />
        <meshStandardMaterial color="#50436d" roughness={0.5} />
      </mesh>

      {/* Stage lighting truss beam */}
      <mesh position={[0, 3.7, 0]}>
        <boxGeometry args={[5.6, 0.25, 3.8]} />
        <meshStandardMaterial color="#746793" metalness={0.2} roughness={0.5} />
      </mesh>

      {/* Stage roof banner */}
      <mesh position={[0, 3.85, -1.8]}>
        <boxGeometry args={[5.4, 0.5, 0.15]} />
        <meshStandardMaterial color={activeColor} />
      </mesh>
    </group>
  );
}

/**
 * 3D Model for a Stall place.
 */
function StallModel({ isHovered, isSelected }: { isHovered: boolean; isSelected: boolean }) {
  const accentColor = CATEGORY_CONFIG.stall.color;
  const hoverColor = CATEGORY_CONFIG.stall.hoverColor;
  const activeColor = isSelected ? hoverColor : isHovered ? hoverColor : accentColor;

  return (
    <group>
      {/* Booth counter body */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.8, 1.4, 2.2]} />
        <meshStandardMaterial color="#f0edf6" roughness={0.7} />
      </mesh>

      {/* Front table counter top */}
      <mesh position={[0, 1.42, 0]}>
        <boxGeometry args={[3.0, 0.1, 2.4]} />
        <meshStandardMaterial color="#5b4d75" roughness={0.5} />
      </mesh>

      {/* Four corner poles */}
      {[
        [-1.3, -0.9],
        [1.3, -0.9],
        [-1.3, 0.9],
        [1.3, 0.9],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 1.9, pz]}>
          <cylinderGeometry args={[0.04, 0.04, 1.0, 6]} />
          <meshStandardMaterial color="#8e81a7" />
        </mesh>
      ))}

      {/* Slanted canopy roof */}
      <mesh position={[0, 2.5, 0]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[3.2, 0.12, 2.6]} />
        <meshStandardMaterial color={activeColor} roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * 3D Model for a Food place.
 */
function FoodModel({ isHovered, isSelected }: { isHovered: boolean; isSelected: boolean }) {
  const accentColor = CATEGORY_CONFIG.food.color;
  const hoverColor = CATEGORY_CONFIG.food.hoverColor;
  const activeColor = isSelected ? hoverColor : isHovered ? hoverColor : accentColor;

  return (
    <group>
      {/* Round kiosk serving counter */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[1.7, 1.8, 1.4, 12]} />
        <meshStandardMaterial color="#f2ebf1" roughness={0.7} />
      </mesh>

      {/* Central umbrella pole */}
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 6]} />
        <meshStandardMaterial color="#7a6074" />
      </mesh>

      {/* Wide conical pagoda canopy */}
      <mesh position={[0, 2.7, 0]}>
        <coneGeometry args={[2.7, 0.9, 12]} />
        <meshStandardMaterial color={activeColor} roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Interactive Place mesh container handling hover, click, and 100% WebGL native billboard pins.
 */
function PlaceObject({
  place,
  isSelected,
  onSelect,
}: {
  place: MapPlaceRow;
  isSelected: boolean;
  onSelect: (place: MapPlaceRow) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const categoryMeta = CATEGORY_CONFIG[place.category];
  const pinHeight = place.category === "stage" ? 4.6 : 3.4;

  // Smooth floating bounce when hovered or selected
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    if (isSelected) {
      groupRef.current.position.y = 0.2 + Math.sin(t * 3.5) * 0.08;
    } else if (hovered) {
      groupRef.current.position.y = 0.15;
    } else {
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[place.position_x, 0, place.position_z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(place);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Category-specific 3D geometry */}
      {place.category === "stage" && (
        <StageModel isHovered={hovered} isSelected={isSelected} />
      )}
      {place.category === "stall" && (
        <StallModel isHovered={hovered} isSelected={isSelected} />
      )}
      {place.category === "food" && (
        <FoodModel isHovered={hovered} isSelected={isSelected} />
      )}

      {/* Selection highlight ring on ground */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[3.2, 3.8, 32]} />
          <meshBasicMaterial color={categoryMeta.color} />
        </mesh>
      )}

      {/* Floating 3D Category Pin Head */}
      <mesh position={[0, pinHeight, 0]}>
        <octahedronGeometry args={[isSelected ? 0.6 : hovered ? 0.52 : 0.45, 0]} />
        <meshStandardMaterial
          color={isSelected ? categoryMeta.hoverColor : categoryMeta.color}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Pin needle stem */}
      <mesh position={[0, pinHeight - 0.35, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
        <meshStandardMaterial color="#7a6e94" />
      </mesh>

      <PlaceLabel
        name={place.name}
        position={[0, pinHeight + 0.9, 0]}
        borderColor={isSelected ? categoryMeta.color : hovered ? "#bcaed4" : "#ded7ea"}
        dotColor={categoryMeta.dotColor}
        textColor={isSelected ? "#45329f" : "#211b26"}
      />
    </group>
  );
}

function PlaceLabel({
  name,
  position,
  borderColor,
  dotColor,
  textColor,
}: {
  name: string;
  position: [number, number, number];
  borderColor: string;
  dotColor: string;
  textColor: string;
}) {
  const { texture, aspect } = useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return { texture: new THREE.CanvasTexture(canvas), aspect: 2 };

    context.font = "600 28px system-ui, sans-serif";
    const width = Math.ceil(context.measureText(name).width) + 94;
    const height = 64;
    canvas.width = width;
    canvas.height = height;

    context.fillStyle = "#ffffff";
    context.strokeStyle = borderColor;
    context.lineWidth = 3;
    context.beginPath();
    context.roundRect(2, 2, width - 4, height - 4, 30);
    context.fill();
    context.stroke();

    context.fillStyle = dotColor;
    context.beginPath();
    context.arc(28, height / 2, 7, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = textColor;
    context.font = "600 28px system-ui, sans-serif";
    context.textBaseline = "middle";
    context.fillText(name, 48, height / 2 + 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return { texture, aspect: width / height };
  }, [borderColor, dotColor, name, textColor]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={position} scale={[aspect * 1.5, 1.5, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

export default function ThreeMap({
  places,
  selectedPlace,
  onSelectPlace,
  filteredCategory,
}: ThreeMapProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const visiblePlaces = useMemo(() => {
    if (filteredCategory === "all") return places;
    return places.filter((p) => p.category === filteredCategory);
  }, [places, filteredCategory]);

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 42, 54], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onPointerMissed={() => onSelectPlace(null)}
      >
        <ambientLight intensity={1.4} />
        <directionalLight
          position={[25, 40, 20]}
          intensity={1.2}
          castShadow={false}
        />
        <directionalLight position={[-20, 25, -20]} intensity={0.4} />

        {/* Clamped OrbitControls preventing losing the scene or dipping under ground */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={16}
          maxDistance={82}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.35}
        />

        <CameraController
          selectedPlace={selectedPlace}
          controlsRef={controlsRef}
        />

        <Ground />

        {visiblePlaces.map((place) => (
          <PlaceObject
            key={place.id}
            place={place}
            isSelected={selectedPlace?.id === place.id}
            onSelect={onSelectPlace}
          />
        ))}
      </Canvas>
    </div>
  );
}
