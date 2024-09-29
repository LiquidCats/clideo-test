// Utility function to get mouse position relative to the canvas
import Point from "../types/point.ts";

export const getMousePos = (event: MouseEvent): Point =>  {
    if (!canvas.value) return { x: 0, y: 0 }
    const rect = canvas.value.getBoundingClientRect()
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    }
}