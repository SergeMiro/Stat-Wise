// Point-in-polygon utilities for assigning DVF transactions to IRIS areas.
// Works on GeoJSON Polygon and MultiPolygon geometries (lon/lat order).

/** Ray-casting test for a point inside a single linear ring [[lon,lat],...]. */
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Point inside a Polygon (outer ring minus holes). */
function pointInPolygon(lon, lat, coords) {
  if (!pointInRing(lon, lat, coords[0])) return false;
  for (let h = 1; h < coords.length; h++) {
    if (pointInRing(lon, lat, coords[h])) return false; // in a hole
  }
  return true;
}

/** Point inside a GeoJSON geometry (Polygon or MultiPolygon). */
export function pointInGeometry(lon, lat, geom) {
  if (!geom) return false;
  if (geom.type === "Polygon") return pointInPolygon(lon, lat, geom.coordinates);
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      if (pointInPolygon(lon, lat, poly)) return true;
    }
    return false;
  }
  return false;
}

/** Axis-aligned bounding box of a geometry for a cheap pre-filter. */
export function bboxOf(geom) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const scan = (ring) => {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  };
  if (geom.type === "Polygon") for (const r of geom.coordinates) scan(r);
  else if (geom.type === "MultiPolygon")
    for (const p of geom.coordinates) for (const r of p) scan(r);
  return { minX, minY, maxX, maxY };
}

/** Centroid (bbox center — good enough for a display point). */
export function centroidOf(geom) {
  const b = bboxOf(geom);
  return { longitude: (b.minX + b.maxX) / 2, latitude: (b.minY + b.maxY) / 2 };
}
