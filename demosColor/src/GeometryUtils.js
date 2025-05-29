import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const TUBE_RADIUS = 0.01; // Diameter would be 0.02
export const TUBE_RADIAL_SEGMENTS = 8; // 4 might be too blocky, 8 is a good compromise
export const TUBE_TUBULAR_SEGMENTS = 1; // For straight lines, 1 segment is enough

/**
 * Creates a single merged BufferGeometry for a series of tubes defined by edges.
 * @param {Array<Object>} edges - An array of edge objects, e.g., [{ start: THREE.Vector3, end: THREE.Vector3 }, ...]
 * @param {number} radius - The radius of the tubes.
 * @param {number} radialSegments - The number of radial segments for the tubes.
 * @param {number} tubularSegments - The number of tubular segments for the tubes (usually 1 for straight lines).
 * @returns {THREE.BufferGeometry | null} - The merged BufferGeometry, or null if no edges or merge fails.
 */
export function createTubesFromEdges(
	edges,
	radius = TUBE_RADIUS,
	radialSegments = TUBE_RADIAL_SEGMENTS,
	tubularSegments = TUBE_TUBULAR_SEGMENTS
) {
	if (!edges || edges.length === 0) {
		return null;
	}

	const tubeGeometries = [];

	for (const edge of edges) {
		if (!edge.start || !edge.end) {
			console.warn('Skipping invalid edge:', edge);
			continue;
		}
		const path = new THREE.LineCurve3(edge.start, edge.end);
		const tubeGeometry = new THREE.TubeGeometry(
			path,
			tubularSegments, // For a straight line, only 1 segment is needed along its length
			radius,
			radialSegments,
			false // closed
		);
		tubeGeometries.push(tubeGeometry);
	}

	if (tubeGeometries.length === 0) {
		return null;
	}

	const mergedGeometry = mergeGeometries(tubeGeometries, false); // false for not using groups

	// Dispose individual geometries after merging
	tubeGeometries.forEach((geometry) => geometry.dispose());

	return mergedGeometry;
}
