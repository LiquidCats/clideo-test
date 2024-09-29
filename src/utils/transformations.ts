import Point from '../types/Point';

/**
 * Rotates a point around a center by a given angle.
 * @param point The point to rotate.
 * @param center The center of rotation.
 * @param angle The rotation angle in radians.
 * @returns The rotated point.
 */
export const rotatePoint = (point: Point, center: Point, angle: number): Point => {
  const cosTheta = Math.cos(angle);
  const sinTheta = Math.sin(angle);
  return {
    x: cosTheta * (point.x - center.x) - sinTheta * (point.y - center.y) + center.x,
    y: sinTheta * (point.x - center.x) + cosTheta * (point.y - center.y) + center.y,
  };
}

/**
 * Scales a point relative to a center point.
 * @param point The point to scale.
 * @param center The center of scaling.
 * @param scaleFactor The scaling factor.
 * @returns The scaled point.
 */
export const scalePoint = (point: Point, center: Point, scaleFactor: number): Point => {
  return {
    x: center.x + (point.x - center.x) * scaleFactor,
    y: center.y + (point.y - center.y) * scaleFactor,
  };
}