import { useCallback } from 'react'
import { useReactFlow } from 'reactflow'

export function useViewportControls() {
  const { zoomIn, zoomOut, setViewport, getNodes, getViewport } = useReactFlow()

  const centerOnNode = useCallback((nodeId: string) => {
    const node = getNodes().find((n) => n.id === nodeId)
    if (node) {
      const currentViewport = getViewport()
      const xOffset = node.position.x + (node.data.dimensions?.width || 0) / 2
      const yOffset = node.position.y + (node.data.dimensions?.height || 0) / 2

      setViewport(
        {
          x: -xOffset * currentViewport.zoom + window.innerWidth / 2,
          y: -yOffset * currentViewport.zoom + window.innerHeight / 2,
          zoom: currentViewport.zoom,
        },
        { duration: 800 }
      )
    }
  }, [getNodes, getViewport, setViewport])

  const handleZoomIn = useCallback(() => {
    zoomIn()
  }, [zoomIn])

  const handleZoomOut = useCallback(() => {
    zoomOut()
  }, [zoomOut])

  const handleReset = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 })
  }, [setViewport])

  return {
    centerOnNode,
    handleZoomIn,
    handleZoomOut,
    handleReset
  }
}