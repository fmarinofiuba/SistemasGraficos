import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as constants from './constants.js';

export const TUBE_RADIUS = constants.outlineEdgeThickness; // Using centralized constant
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
/**
 * Creates directional arcs with arrowheads to indicate rotation/direction.
 * @param {THREE.Object3D} parent - The parent object to add arcs and arrowheads to
 * @param {Array<Object>} arcsData - Array of arc data objects with startAngleDeg and endAngleDeg
 * @param {number} arcRadius - Radius of the arcs
 * @param {number} arcY - Y position of the arcs
 * @param {THREE.Material} material - Material for arcs and arrowheads
 */
export function createDirectionalArcs(parent, arcsData, arcRadius, arcY, material) {
	const arcTubeRadius = constants.outlineEdgeThickness * 0.8; // Slightly thinner tubes for arrows
	const radialSegments = 8; // Segments around the tube
	const tubularSegments = 24; // Segments along the arc

	arcsData.forEach((arcData) => {
		const startRad = THREE.MathUtils.degToRad(arcData.startAngleDeg);
		const endRad = THREE.MathUtils.degToRad(arcData.endAngleDeg);
		const arcLength = endRad - startRad;

		// Create the arc using TorusGeometry for better quality and performance
		const arcGeometry = new THREE.TorusGeometry(
			arcRadius, // radius of the torus
			arcTubeRadius, // tube radius
			radialSegments, // radial segments
			tubularSegments, // tubular segments
			arcLength // arc length in radians
		);

		// Rotate and position the arc to match the start angle
		// By default, TorusGeometry starts at 0 degrees and rotates around the z-axis
		// We need to rotate it around the y-axis and position it at the right height
		arcGeometry.rotateY(startRad);
		arcGeometry.rotateX(Math.PI / 2); // Rotate to horizontal plane

		// Create mesh and add to parent
		const arcMesh = new THREE.Mesh(arcGeometry, material);
		arcMesh.position.set(0, arcY, 0); // Position at the specified Y level
		parent.add(arcMesh);

		// Add arrowhead at the end of the arc
		// Calculate the position of the arrowhead
		const arrowPos = new THREE.Vector3(arcRadius * Math.cos(endRad), arcY, arcRadius * Math.sin(endRad));

		// Calculate the direction tangent to the circle at the end point
		// This is perpendicular to the radius vector
		const radiusVector = new THREE.Vector3(Math.cos(endRad), 0, Math.sin(endRad));
		const tangentVector = new THREE.Vector3(-radiusVector.z, 0, radiusVector.x).normalize();

		// Create the arrowhead
		const arrowhead = new THREE.Mesh(
			new THREE.ConeGeometry(constants.arrowRadius, constants.arrowLength, 16),
			material
		);

		// Position the arrowhead at the end of the arc
		arrowhead.position.copy(arrowPos);

		// Orient the arrowhead to point in the tangent direction
		// By default, the cone points in the +Y direction, so we need to rotate it
		const quaternion = new THREE.Quaternion().setFromUnitVectors(
			new THREE.Vector3(0, 1, 0), // Default cone direction
			tangentVector // Direction we want it to point
		);
		arrowhead.quaternion.multiply(quaternion);

		// Offset the arrowhead position to align it with the end of the arc
		arrowhead.position.addScaledVector(tangentVector, constants.arrowLength / 2);

		// Add the arrowhead to the parent
		parent.add(arrowhead);
	});
}

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
