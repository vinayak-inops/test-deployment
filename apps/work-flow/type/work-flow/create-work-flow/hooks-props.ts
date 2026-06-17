import { NodeDimensions } from "./node";

export interface InfoNodeProps {
    infoNodeId: string;
    position: { x: number; y: number };
    nodeType: string;
    type: {
      stateData: any;
    };
    selectedNodeData?: {
      id: string;
    };
    parentStateName:string
    updateNodeType: (nodeId: string, nodeType: string) => void;
    nodeDimensions: NodeDimensions;
    deleteFunctionLocal:any,
  updateNodeValueLocal:any,
  addNewStateLocal:any
  }