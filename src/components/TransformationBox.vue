<template>
    <canvas
        ref="canvas"
        :width="canvasWidth"
        :height="canvasHeight"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
    ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import Point from '../types/Point'
import { rotatePoint, scalePoint } from '../utils/transformations'
import { calculateAffineTransform } from '../utils/math.ts'

const canvasWidth = 800
const canvasHeight = 600
const handleSize = 15
const image = new Image()

// Sample image to be drawn inside the box
image.src = 'https://purr.objects-us-east-1.dream.io/i/capture.png'

image.onload = () => {
    if (!context.value) {
        return
    }
    updateRotationHandle()
    // Schedule a redraw
    needsRedraw.value = true
}

image.onerror = () => {
    console.error('Failed to load the image.')
    alert('Failed to load the image. Please check the image path or source.')
}

// Reference to the canvas and its context
const canvas = ref<HTMLCanvasElement | null>(null)
const context = ref<CanvasRenderingContext2D | null>(null)

// Flags for dragging, scaling, and rotating
const dragging = ref(false)
const scaling = ref(false)
const rotating = ref(false)

// Flag to indicate whether a redraw is needed
const needsRedraw = ref(false)

// Variables for scaling and rotating
const selectedHandle = ref<number | null>(null)
const initialMousePos = reactive<Point>({ x: 0, y: 0 })
const initialVertices = ref<Point[]>([])
const rotationCenter = reactive<Point>({ x: 0, y: 0 }) // Center of rotation
const initialAngle = ref(0) // Initial angle between mouse and center
const rotationHandle = reactive<Point>({ x: 0, y: 0 }) // Position of the rotation handle

// Initialize the vertices of the box (a rectangle)
const vertices = reactive<Point[]>([
    { x: 300, y: 200 }, // Top-left
    { x: 500, y: 200 }, // Top-right
    { x: 500, y: 400 }, // Bottom-right
    { x: 300, y: 400 }, // Bottom-left
])

// Update rotation handle position based on vertices
function updateRotationHandle () {
    // Calculate center of the box
    rotationCenter.x = (vertices[0].x + vertices[2].x) / 2
    rotationCenter.y = (vertices[0].y + vertices[2].y) / 2

    // Place the rotation handle above the top edge
    const topEdgeCenter = {
        x: (vertices[0].x + vertices[1].x) / 2,
        y: (vertices[0].y + vertices[1].y) / 2,
    }

    const handleOffset = 30 // Distance from the top edge
    const angle = Math.atan2(
        vertices[1].y - vertices[0].y,
        vertices[1].x - vertices[0].x
    )

    rotationHandle.x = topEdgeCenter.x + handleOffset * Math.cos(angle - Math.PI / 2)
    rotationHandle.y = topEdgeCenter.y + handleOffset * Math.sin(angle - Math.PI / 2)
}

const getMousePos = (event: MouseEvent): Point =>  {
    if (!canvas.value) return { x: 0, y: 0 }
    const rect = canvas.value.getBoundingClientRect()
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    }
}

// Draws the transformation box, image, handles, and rotation handle
const draw = () => {
    if (!context.value) {
        return
    }
    const ctx: CanvasRenderingContext2D = context.value
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Save the context state
    ctx.save()

    // Calculate the transformation matrix
    const matrix = calculateAffineTransform(
        { x: 0, y: 0 },
        { x: image.width, y: 0 },
        { x: image.width, y: image.height },
        { x: 0, y: image.height },
        vertices[0],
        vertices[1],
        vertices[2],
        vertices[3]
    )

    // Apply the transformation
    ctx.setTransform(matrix)

    // Draw the image
    ctx.drawImage(image, 0, 0)

    // Restore the context state
    ctx.restore()

    // Draw the transformation box
    ctx.beginPath()
    ctx.moveTo(vertices[0].x, vertices[0].y)
    vertices.forEach((vertex, index) => {
        if (index > 0) {
            ctx.lineTo(vertex.x, vertex.y)
        }
    })
    ctx.closePath()
    ctx.strokeStyle = 'orange'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw handles
    vertices.forEach(vertex => {
        ctx.beginPath()
        ctx.arc(vertex.x, vertex.y, handleSize / 2, 0, 2 * Math.PI)
        ctx.fillStyle = 'white'
        ctx.fill()
        ctx.strokeStyle = 'black'
        ctx.stroke()
    })

    // Draw rotation handle
    ctx.beginPath()
    ctx.arc(rotationHandle.x, rotationHandle.y, handleSize / 2, 0, 2 * Math.PI)
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.strokeStyle = 'transparent'
    ctx.stroke()
}

// Checks if the mouse is over a handle or rotation handle
function getHandleUnderMouse(mousePos: Point): number | 'rotation' | null {
    // Check rotation handle first
    const dx = mousePos.x - rotationHandle.x
    const dy = mousePos.y - rotationHandle.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance <= handleSize) {
        return 'rotation'
    }

    // Check corner handles
    for (let i = 0; i < vertices.length; i++) {
        const vertex = vertices[i]
        if (
            mousePos.x >= vertex.x - handleSize &&
            mousePos.x <= vertex.x + handleSize &&
            mousePos.y >= vertex.y - handleSize &&
            mousePos.y <= vertex.y + handleSize
        ) {
            return i
        }
    }
    return null
}

function onMouseDown(event: MouseEvent) {
    const mousePos = getMousePos(event)
    const handle = getHandleUnderMouse(mousePos)

    if (handle === 'rotation') {
        // Start rotating
        rotating.value = true
        initialMousePos.x = mousePos.x
        initialMousePos.y = mousePos.y
        initialVertices.value = vertices.map(v => ({ ...v }))
        // Calculate initial angle
        initialAngle.value = Math.atan2(
            mousePos.y - rotationCenter.y,
            mousePos.x - rotationCenter.x
        )
    } else if (typeof handle === 'number') {
        // Start scaling
        scaling.value = true
        selectedHandle.value = handle
        initialMousePos.x = mousePos.x
        initialMousePos.y = mousePos.y
        initialVertices.value = vertices.map(v => ({ ...v }))
    } else {
        // Start dragging
        dragging.value = true
        initialMousePos.x = mousePos.x
        initialMousePos.y = mousePos.y
        initialVertices.value = vertices.map(v => ({ ...v }))
    }
}

function onMouseMove(event: MouseEvent) {
    if (!dragging.value && !scaling.value && !rotating.value) {
        return
    }

    const mousePos = getMousePos(event)
    const dx = mousePos.x - initialMousePos.x
    const dy = mousePos.y - initialMousePos.y

    if (dragging.value) {
        // Move all vertices
        for (let i = 0; i < vertices.length; i++) {
            vertices[i].x = initialVertices.value[i].x + dx
            vertices[i].y = initialVertices.value[i].y + dy
        }
        updateRotationHandle()
    } else if (scaling.value && selectedHandle.value !== null) {
        // Scale the box proportionally
        const oppositeHandle = (selectedHandle.value + 2) % 4
        const fixedPoint = initialVertices.value[oppositeHandle]
        const movingPoint = {
            x: initialVertices.value[selectedHandle.value].x + dx,
            y: initialVertices.value[selectedHandle.value].y + dy
        }

        // Calculate scaling factor based on distance between fixed and moving point
        const initialDistance = Math.hypot(
            initialVertices.value[selectedHandle.value].x - fixedPoint.x,
            initialVertices.value[selectedHandle.value].y - fixedPoint.y
        )
        const currentDistance = Math.hypot(movingPoint.x - fixedPoint.x, movingPoint.y - fixedPoint.y)
        const scaleFactor = currentDistance / initialDistance

        // Scale all vertices relative to the fixed point
        for (let i = 0; i < vertices.length; i++) {
            vertices[i] = scalePoint(initialVertices.value[i], fixedPoint, scaleFactor)
        }
        updateRotationHandle()
    } else if (rotating.value) {
        // Rotate the box around its center
        const currentAngle = Math.atan2(
            mousePos.y - rotationCenter.y,
            mousePos.x - rotationCenter.x
        )
        const angleDelta = currentAngle - initialAngle.value

        // Rotate all vertices around the center
        for (let i = 0; i < vertices.length; i++) {
            vertices[i] = rotatePoint(initialVertices.value[i], rotationCenter, angleDelta)
        }
        updateRotationHandle()
    }

    // Schedule a redraw
    needsRedraw.value = true
}

function onMouseUp() {
    dragging.value = false
    scaling.value = false
    rotating.value = false
    selectedHandle.value = null
}

// Animation loop using requestAnimationFrame
function animationLoop() {
    if (needsRedraw.value) {
        draw()
        needsRedraw.value = false
    }
    requestAnimationFrame(animationLoop)
}

// Start the animation loop and initialize the canvas
onMounted(() => {
    if (canvas.value) {
        context.value = canvas.value.getContext('2d')
        if (image.complete) {
            updateRotationHandle()
            // Schedule initial redraw
            needsRedraw.value = true
        }
        // Start the animation loop
        animationLoop()
    }
})
</script>

<style scoped>
canvas {
    background: black;
    border: 1px solid #ccc;
}
</style>