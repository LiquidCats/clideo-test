// Multiply two matrices
import Point from "../types/point.ts";

const multiplyMatrices = (A: number[][], B: number[][]): number[][] => {
    const result = Array(A.length).fill(0).map(() => Array(B[0].length).fill(0));
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < B[0].length; j++) {
            for (let k = 0; k < A[0].length; k++) {
                result[i][j] += A[i][k] * B[k][j]
            }
        }
    }

    return result
}

// Multiply a matrix and a vector
const multiplyMatrixVector = (matrix: number[][], vector: number[]): number[] => {
    return matrix.map(row => row.reduce((sum, val, idx) => sum + val * vector[idx], 0))
}

// Function to solve the linear system using least squares
const solveMatrix = (matrix: number[][], rhs: number[]): number[] => {
    // For simplicity, we'll use the pseudo-inverse method
    // In a production environment, you might want to use a proper linear algebra library
    // But since external libraries are not allowed, we'll implement a simple solver

    // Convert the matrix to a 2D array and the RHS to an array
    // Use the normal equations: (A^T * A) * x = A^T * b

    const AT = transposeMatrix(matrix);
    const ATA = multiplyMatrices(AT, matrix);
    const ATb = multiplyMatrixVector(AT, rhs);

    // Now solve ATA * x = ATb
    return gaussianElimination(ATA, ATb);
};

// Transpose of a matrix
const transposeMatrix = (matrix: number[][]): number[][] => {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
};

// Gaussian elimination solver
const gaussianElimination = (A: number[][], b: number[]): number[] => {
    const n = b.length;
    for (let i = 0; i < n; i++) {
        // Search for maximum in this column
        let maxEl = Math.abs(A[i][i]);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > maxEl) {
                maxEl = Math.abs(A[k][i]);
                maxRow = k;
            }
        }

        // Swap maximum row with current row (column by column)
        for (let k = i; k < n; k++) {
            const tmp = A[maxRow][k];
            A[maxRow][k] = A[i][k];
            A[i][k] = tmp;
        }
        const tmp = b[maxRow];
        b[maxRow] = b[i];
        b[i] = tmp;

        // Make all rows below this one 0 in current column
        for (let k = i + 1; k < n; k++) {
            const c = -A[k][i] / A[i][i];
            for (let j = i; j < n; j++) {
                if (i === j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
            b[k] += c * b[i];
        }
    }

    // Solve equation Ax=b for an upper triangular matrix A
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = b[i] / A[i][i];
        for (let k = i - 1; k >= 0; k--) {
            b[k] -= A[k][i] * x[i];
        }
    }
    return x;
}

// Calculate the affine transformation matrix
export const calculateAffineTransform = (
    p0: Point, p1: Point, p2: Point, p3: Point,
    q0: Point, q1: Point, q2: Point, q3: Point
): DOMMatrix2DInit => {
    // Solving the linear equations to find the transformation matrix coefficients
    // This involves solving for a, b, c, d, e, f in the equations:
    // qx = a * px + c * py + e
    // qy = b * px + d * py + f
    // For points p0 to p3 mapping to q0 to q3
    const matrix = [
        [p0.x, p0.y, 1, 0, 0, 0, -q0.x * p0.x, -q0.x * p0.y],
        [0, 0, 0, p0.x, p0.y, 1, -q0.y * p0.x, -q0.y * p0.y],
        [p1.x, p1.y, 1, 0, 0, 0, -q1.x * p1.x, -q1.x * p1.y],
        [0, 0, 0, p1.x, p1.y, 1, -q1.y * p1.x, -q1.y * p1.y],
        [p2.x, p2.y, 1, 0, 0, 0, -q2.x * p2.x, -q2.x * p2.y],
        [0, 0, 0, p2.x, p2.y, 1, -q2.y * p2.x, -q2.y * p2.y],
        [p3.x, p3.y, 1, 0, 0, 0, -q3.x * p3.x, -q3.x * p3.y],
        [0, 0, 0, p3.x, p3.y, 1, -q3.y * p3.x, -q3.y * p3.y],
    ];

    const rhs = [q0.x, q0.y, q1.x, q1.y, q2.x, q2.y, q3.x, q3.y];

    // Solve the system using least squares
    const coeffs = solveMatrix(matrix, rhs);


    // Return the transformation matrix coefficients
    return new DOMMatrix([
        coeffs[0], // a
        coeffs[3], // b
        coeffs[1], // c
        coeffs[4], // d
        coeffs[2], // e
        coeffs[5], // f
    ]);
}