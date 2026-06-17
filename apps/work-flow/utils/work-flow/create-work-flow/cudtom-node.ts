import { Node } from "reactflow";

// Delete nodes from the node list
export function deleteFunction(
  data: any,
  id: string,
  setNodes: any
) {
    let selectedId =
    data?.parentInfoNodeId?.startsWith("info-node") &&
    !id.startsWith("info-node")
      ? data.parentInfoNodeId
      : id;

      setNodes((nodes:any) => {
        return nodes.filter((node:any) => {
          if (selectedId && !node.id.includes(selectedId)) {
            return node;
          }
        });
      });
}

// Update the node values
export function updateNodeValue(
  setNodes: (
    payload: Node<any>[] | ((nodes: Node<any>[]) => Node<any>[])
  ) => void,
  selectedId:string|undefined
) {
  setNodes((nodes) => {
    return nodes.map((node) => {
      if (
        node.id === `info-node-${selectedId}` ||
        node.id === selectedId
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            action: "edit",
          },
        };
      }
      return {
        ...node,
        data: {
          ...node.data,
          action: "create",
        },
      };
    });
  });
}


//Add new value to workflow
export function addNewState(
  setNodes: (
    payload: Node<any>[] | ((nodes: Node<any>[]) => Node<any>[])
  ) => void,
  selectedId:string|undefined
) {
  setNodes((nodes) => {
    return nodes.map((node) => {
      if (
        node.id === `info-node-${selectedId}` ||
        node.id === selectedId
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            action: "add",
          },
        };
      }
      return {
        ...node,
        data: {
          ...node.data,
          action: "create",
        },
      };
    });
  });
}

//Dividing a sentence into an array of strings
export const formatText = (text: string) => {
  if (typeof text === "string") {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      // Check if adding the next word would exceed 15 characters
      if ((currentLine + " " + word).trim().length > 30) {
        // Push current line if it's not empty
        if (currentLine) {
          lines.push(currentLine.trim());
        }
        currentLine = word;
      } else {
        // Add word to current line
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    });

    // Add the last line
    if (currentLine) {
      lines.push(currentLine.trim());
    }

    return lines;
  }
};



