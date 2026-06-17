export interface NodeDimensions {
  width: number;
  height: number;
}

export interface stateData{

}

export interface NodeData{
    nodeType: string;
    stateData: any;
    modeOfSelect: string;
    connectedHandles: {
      left: string;
      right: string;
    };
    action: string;
    parentInfoNodeId: string;
    presentNodeId: string;
    updateNodeType: (nodeId: string, nodeType: string) => void;
    dimensions: NodeDimensions;
  };

export interface Node {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: NodeData
}
