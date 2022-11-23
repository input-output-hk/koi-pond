/*
 * Linearly maps n from range [ a, b ] -> [ x, y ]
 */
export const map = (n, a, b, x, y) => x + (n - a) * (y - x) / (b - a)

/**
 * Linear Interpolation
 *
 * @param {*} v0
 * @param {*} v1
 * @param {*} t
 * @returns
 */
export function lerp (v0, v1, t) {
  return v0 * (1 - t) + v1 * t
}
