"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { MapPlaceRow, MapCategory } from "@/lib/supabase/types";
import { GROUND_CONFIG, CATEGORY_CONFIG, CAMPUS_FEATURES } from "@/lib/map-config";

interface MapEditorProps {
  initialPlaces: MapPlaceRow[];
}

export function MapEditor({ initialPlaces }: MapEditorProps) {
  const [places, setPlaces] = useState<MapPlaceRow[]>(initialPlaces);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MapCategory>("stall");
  const [description, setDescription] = useState("");
  const [locationTag, setLocationTag] = useState("");
  const [posX, setPosX] = useState(0);
  const [posZ, setPosZ] = useState(0);

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Status & Confirmation
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

  const selectPlace = useCallback((place: MapPlaceRow | null) => {
    if (place) {
      setSelectedPlaceId(place.id);
      setIsAddingNew(false);
      setName(place.name);
      setCategory(place.category);
      setDescription(place.description);
      setLocationTag(place.location_tag);
      setPosX(Math.round(place.position_x * 10) / 10);
      setPosZ(Math.round(place.position_z * 10) / 10);
    } else {
      setSelectedPlaceId(null);
      setIsAddingNew(false);
      setName("");
      setCategory("stall");
      setDescription("");
      setLocationTag("");
      setPosX(0);
      setPosZ(0);
    }
  }, []);

  const startAddNew = useCallback((defaultX = 0, defaultZ = 0) => {
    setSelectedPlaceId(null);
    setIsAddingNew(true);
    setName("");
    setCategory("stall");
    setDescription("");
    setLocationTag("");
    setPosX(defaultX);
    setPosZ(defaultZ);
  }, []);

  // Convert SVG mouse/touch event into ground coordinates [-45, 45]
  const getGroundCoords = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    if (!svgRef.current) return { x: 0, z: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();

    if ("touches" in e && e.touches.length > 0) {
      pt.x = e.touches[0].clientX;
      pt.y = e.touches[0].clientY;
    } else if ("clientX" in e) {
      pt.x = e.clientX;
      pt.y = e.clientY;
    }

    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const clampedX = Math.max(-40, Math.min(40, svgP.x));
    const clampedZ = Math.max(-40, Math.min(40, svgP.y));
    return {
      x: Math.round(clampedX * 10) / 10,
      z: Math.round(clampedZ * 10) / 10,
    };
  }, []);

  // Handle click on the canvas to add or reposition
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingId) return;
    const { x, z } = getGroundCoords(e);
    startAddNew(x, z);
    setStatusMessage({ text: `Set location at ground coordinates (${x}, ${z}). Enter details to save.` });
  };

  // Start dragging a pin
  const handlePinMouseDown = (e: React.MouseEvent, place: MapPlaceRow) => {
    e.stopPropagation();
    selectPlace(place);
    setDraggingId(place.id);
  };

  // Mouse move while dragging
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingId) return;
      const { x, z } = getGroundCoords(e);
      setPlaces((prev) =>
        prev.map((p) => (p.id === draggingId ? { ...p, position_x: x, position_z: z } : p)),
      );
      setPosX(x);
      setPosZ(z);
    },
    [draggingId, getGroundCoords],
  );

  // Mouse up to finish dragging and persist coordinates to server
  const handleMouseUp = useCallback(async () => {
    if (!draggingId) return;
    const activeId = draggingId;
    setDraggingId(null);

    const place = places.find((p) => p.id === activeId);
    if (!place) return;

    try {
      const res = await fetch("/api/admin/map", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeId,
          position_x: place.position_x,
          position_z: place.position_z,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setStatusMessage({ text: data.error || "Failed to update position.", isError: true });
      } else {
        setStatusMessage({
          text: `Updated "${place.name}" position to (${place.position_x}, ${place.position_z}).`,
        });
      }
    } catch {
      setStatusMessage({ text: "Network error while updating position.", isError: true });
    }
  }, [draggingId, places]);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  // Save changes (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      if (isAddingNew) {
        const res = await fetch("/api/admin/map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            category,
            description,
            location_tag: locationTag,
            position_x: posX,
            position_z: posZ,
          }),
        });

        const data = await res.json();
        if (!data.ok) {
          setStatusMessage({ text: data.error || "Failed to create place.", isError: true });
        } else {
          setPlaces((prev) => [...prev, data.place]);
          selectPlace(data.place);
          setStatusMessage({ text: `Created place "${data.place.name}" successfully.` });
        }
      } else if (selectedPlaceId) {
        const res = await fetch("/api/admin/map", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedPlaceId,
            name,
            category,
            description,
            location_tag: locationTag,
            position_x: posX,
            position_z: posZ,
          }),
        });

        const data = await res.json();
        if (!data.ok) {
          setStatusMessage({ text: data.error || "Failed to update place.", isError: true });
        } else {
          setPlaces((prev) =>
            prev.map((p) => (p.id === selectedPlaceId ? data.place : p)),
          );
          setStatusMessage({ text: `Updated place "${data.place.name}" successfully.` });
        }
      }
    } catch {
      setStatusMessage({ text: "An error occurred while saving.", isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete place
  const handleDeletePlace = async (id: string) => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/map?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!data.ok) {
        setStatusMessage({ text: data.error || "Failed to delete place.", isError: true });
      } else {
        setPlaces((prev) => prev.filter((p) => p.id !== id));
        if (selectedPlaceId === id) {
          selectPlace(null);
        }
        setStatusMessage({ text: "Place removed from map." });
      }
    } catch {
      setStatusMessage({ text: "Failed to communicate with server.", isError: true });
    } finally {
      setIsSaving(false);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Status banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-field border px-4 py-3 text-xs ${
            statusMessage.isError
              ? "border-red-300 bg-red-50 text-red-900"
              : "border-accent/20 bg-accent-wash text-accent-strong"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-ink-muted hover:text-ink text-sm font-semibold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Grid: Top-down Interactive Canvas (Left/Top) + Editor Form (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Top-Down Map Editor Canvas */}
        <div className="flex flex-col gap-2 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-medium text-ink">Ground layout editor</h2>
              <p className="text-xs text-ink-muted">
                Click anywhere on the ground to place a new spot, or drag existing pins to reposition.
              </p>
            </div>
            <button
              type="button"
              onClick={() => startAddNew(0, 0)}
              className="rounded-field border border-accent bg-canvas px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-wash transition-colors"
            >
              + Add place
            </button>
          </div>

          <div className="relative aspect-square w-full overflow-hidden rounded-card border border-hairline bg-canvas-raised shadow-xs">
            <svg
              ref={svgRef}
              viewBox="-46 -46 92 92"
              onClick={handleCanvasClick}
              className="h-full w-full cursor-crosshair select-none"
            >
              {/* Subtle grid pattern for scale and precision */}
              <defs>
                <pattern id="editor-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#ddd7e8" strokeWidth="0.2" />
                </pattern>
              </defs>

              {/* Base terrain */}
              <rect x="-44" y="-44" width="88" height="88" rx="4" fill={GROUND_CONFIG.groundColor} />
              <rect x="-44" y="-44" width="88" height="88" rx="4" fill="url(#editor-grid)" />

              {/* Perimeter border */}
              <rect
                x="-42"
                y="-42"
                width="84"
                height="84"
                rx="3"
                fill="none"
                stroke={GROUND_CONFIG.borderRingColor}
                strokeWidth="0.5"
                strokeDasharray="2 1"
              />

              {/* Lawns */}
              {CAMPUS_FEATURES.lawns.map((lawn, i) => (
                <rect
                  key={i}
                  x={lawn.x - lawn.w / 2}
                  y={lawn.z - lawn.d / 2}
                  width={lawn.w}
                  height={lawn.d}
                  rx="2"
                  fill={GROUND_CONFIG.lawnColor}
                  stroke="#cfd8cb"
                  strokeWidth="0.2"
                />
              ))}

              {/* Walkways */}
              <rect x="-3" y="-40" width="6" height="80" fill={GROUND_CONFIG.pavementColor} />
              <rect x="-40" y="-3" width="80" height="6" fill={GROUND_CONFIG.pavementColor} />
              <circle cx="0" cy="0" r="14" fill={GROUND_CONFIG.pavementColor} stroke="#ddd7e8" strokeWidth="0.3" />

              {/* Entrance Gate */}
              <g transform={`translate(${CAMPUS_FEATURES.entrance.x}, ${CAMPUS_FEATURES.entrance.z})`}>
                <rect x="-5" y="-1" width="10" height="2" rx="0.5" fill="#5a45d6" opacity="0.9" />
                <text y="3.2" textAnchor="middle" className="fill-ink-muted text-[2.2px] font-sans font-medium">
                  Main Entrance Gate
                </text>
              </g>

              {/* Coordinate axis crosshairs */}
              <line x1="-42" y1="0" x2="42" y2="0" stroke="#b9aed0" strokeWidth="0.2" strokeDasharray="1 1" />
              <line x1="0" y1="-42" x2="0" y2="42" stroke="#b9aed0" strokeWidth="0.2" strokeDasharray="1 1" />

              {/* Place Pins */}
              {places.map((place) => {
                const isSelected = selectedPlaceId === place.id;
                const isDragging = draggingId === place.id;
                const meta = CATEGORY_CONFIG[place.category];

                return (
                  <g
                    key={place.id}
                    transform={`translate(${place.position_x}, ${place.position_z})`}
                    onMouseDown={(e) => handlePinMouseDown(e, place)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    {/* Enlarged hit area */}
                    <circle r="6" fill="transparent" />

                    {/* Active highlight ring */}
                    {isSelected && (
                      <circle
                        r="4.4"
                        fill="none"
                        stroke={meta.color}
                        strokeWidth="0.7"
                        strokeDasharray={isDragging ? "1 1" : undefined}
                      />
                    )}

                    {/* Pin Circle */}
                    <circle
                      r={isSelected ? 3.2 : 2.5}
                      fill={meta.color}
                      stroke="#ffffff"
                      strokeWidth="0.6"
                      className="filter drop-shadow-sm transition-all"
                    />

                    {/* Category icon */}
                    {place.category === "stage" && (
                      <polygon points="-1,-1 1.2,0 -1,1" fill="#ffffff" transform="scale(0.8)" />
                    )}
                    {place.category === "stall" && (
                      <rect x="-1.1" y="-1.1" width="2.2" height="2.2" rx="0.3" fill="#ffffff" transform="scale(0.7)" />
                    )}
                    {place.category === "food" && (
                      <circle r="1" fill="#ffffff" transform="scale(0.8)" />
                    )}

                    {/* Label */}
                    <text
                      y={isSelected ? "4.9" : "4.4"}
                      textAnchor="middle"
                      className={`pointer-events-none select-none text-[2.2px] font-sans font-medium ${
                        isSelected ? "fill-accent-strong font-bold" : "fill-ink"
                      }`}
                      style={{
                        textShadow:
                          "0 1px 2px rgba(255, 255, 255, 0.95), 0 -1px 2px rgba(255, 255, 255, 0.95)",
                      }}
                    >
                      {place.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Place Detail & Editing Form (Right Side) */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="rounded-card border border-hairline bg-canvas p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-serif text-base font-medium text-ink">
                {isAddingNew
                  ? "Add new map place"
                  : selectedPlace
                    ? `Edit: ${selectedPlace.name}`
                    : "Place details"}
              </h3>
              {(selectedPlace || isAddingNew) && (
                <button
                  type="button"
                  onClick={() => selectPlace(null)}
                  className="text-xs text-ink-muted hover:text-ink underline"
                >
                  Clear selection
                </button>
              )}
            </div>

            {selectedPlace || isAddingNew ? (
              <form onSubmit={handleSubmitForm} className="mt-4 flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label htmlFor="place-name" className="block text-xs font-medium text-ink-muted">
                    Place Name
                  </label>
                  <input
                    id="place-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acoustic Garden Stage"
                    className="mt-1 w-full rounded-field border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="place-category" className="block text-xs font-medium text-ink-muted">
                    Category
                  </label>
                  <select
                    id="place-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MapCategory)}
                    className="mt-1 w-full rounded-field border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                  >
                    <option value="stall">Stalls & Exhibits (Booths)</option>
                    <option value="stage">Stages & Performance Areas</option>
                    <option value="food">Food & Drink Spots</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="place-desc" className="block text-xs font-medium text-ink-muted">
                    What is sold or performed
                  </label>
                  <textarea
                    id="place-desc"
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of merchandise, performances, or culinary items..."
                    className="mt-1 w-full rounded-field border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Location Tag */}
                <div>
                  <label htmlFor="place-loc" className="block text-xs font-medium text-ink-muted">
                    Location Tag
                  </label>
                  <input
                    id="place-loc"
                    type="text"
                    required
                    value={locationTag}
                    onChange={(e) => setLocationTag(e.target.value)}
                    placeholder="e.g. Near main gate, East lawn"
                    className="mt-1 w-full rounded-field border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Ground Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="pos-x" className="block text-xs font-medium text-ink-muted">
                      Coordinate X (-40 to 40)
                    </label>
                    <input
                      id="pos-x"
                      type="number"
                      step="0.5"
                      min="-40"
                      max="40"
                      value={posX}
                      onChange={(e) => setPosX(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-field border border-hairline bg-canvas px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="pos-z" className="block text-xs font-medium text-ink-muted">
                      Coordinate Z (-40 to 40)
                    </label>
                    <input
                      id="pos-z"
                      type="number"
                      step="0.5"
                      min="-40"
                      max="40"
                      value={posZ}
                      onChange={(e) => setPosZ(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-field border border-hairline bg-canvas px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-hairline">
                  {selectedPlace && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedPlace.id)}
                      className="rounded-field border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete place
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => selectPlace(null)}
                      className="rounded-field border border-hairline px-3 py-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-field bg-accent px-4 py-2 text-xs font-medium text-canvas hover:bg-accent-strong disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? "Saving..." : isAddingNew ? "Add place" : "Save changes"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="py-10 text-center text-xs text-ink-muted">
                <p>No place selected.</p>
                <p className="mt-1">
                  Click on an existing pin to edit, or click anywhere on the ground to create a new spot.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Deletion */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
        >
          <div className="w-full max-w-sm rounded-card border border-hairline bg-canvas p-6 shadow-xl">
            <h4 className="font-serif text-lg font-medium text-ink">Confirm deletion</h4>
            <p className="mt-2 text-xs text-ink-muted leading-relaxed">
              Are you sure you want to delete this place? This change will be permanently logged to the admin audit log and removed from both the 3D map and 2D view.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-field border border-hairline px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleDeletePlace(confirmDeleteId)}
                className="rounded-field bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSaving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Places Table */}
      <div className="mt-4 overflow-hidden rounded-card border border-hairline bg-canvas shadow-xs">
        <div className="border-b border-hairline px-5 py-3">
          <h3 className="font-serif text-sm font-medium text-ink">All map places ({places.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hairline bg-canvas-raised text-ink-muted font-medium">
              <tr>
                <th className="px-5 py-2.5">Name</th>
                <th className="px-5 py-2.5">Category</th>
                <th className="px-5 py-2.5">Location Tag</th>
                <th className="px-5 py-2.5">Coordinates (X, Z)</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {places.map((place) => {
                const meta = CATEGORY_CONFIG[place.category];
                const isSelected = selectedPlaceId === place.id;

                return (
                  <tr
                    key={place.id}
                    className={`transition-colors hover:bg-accent-wash/30 cursor-pointer ${
                      isSelected ? "bg-accent-wash/50" : ""
                    }`}
                    onClick={() => selectPlace(place)}
                  >
                    <td className="px-5 py-3 font-medium text-ink">{place.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dotColor }} />
                        {meta.singular}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{place.location_tag}</td>
                    <td className="px-5 py-3 font-mono text-ink-muted">
                      ({place.position_x}, {place.position_z})
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectPlace(place);
                          }}
                          className="text-xs text-accent hover:text-accent-strong font-medium underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(place.id);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
