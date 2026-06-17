import { useCallback } from 'react'
import { Node } from 'reactflow'

export function useNodeManagement(setNodes:React.Dispatch<React.SetStateAction<Node[]>> ) {
  const updateNodeType = useCallback(
    (nodeId: string, newType: string) => {
      setNodes((nds: Node[]) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                nodeType: newType,
                label: newType,
              },
            }
          }
          return node
        })
      )
    },
    [setNodes]
  )

  return { updateNodeType }
}