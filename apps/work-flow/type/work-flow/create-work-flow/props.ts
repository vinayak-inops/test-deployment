import { Dispatch, SetStateAction } from "react";
import { NodeData } from "./node";
import { Position } from "reactflow";

//WorkflowTrigger
export interface WorkflowTriggerProps {
  nodes: any[];
  onAddNode: (node: { node: string; stateData?: any }) => void;
}

//CustomNode
export interface CustomNodeData {
  nodeType: string;
  connectedHandles: Record<string, "source" | "target">;
  selected: boolean;
  data: NodeData;
  parentInfoNodeId?: string;
  presentNodeId?: string;
  stateData?: {
    state?: {
      title?: string;
    };
  };
  setOpenSelectBox?: Dispatch<SetStateAction<boolean>>;
  deleteFunctionLocal:any;
  updateNodeValueLocal:any;
  addNewStateLocal:any
}

//Controls
export interface ControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

//circle node
export interface CircleNodeProps {
  data: any;
  getHandleType: any;
  handleStyle: any;
  formattedLines: string[] | undefined;
  deleteFunction?: any;
  updateNodeValue?: any;
  addNewState?: any;
  setSelectedId: Dispatch<SetStateAction<string | undefined>>
}
//Form navigation button
export interface FormNavigationButtonProps {
  showBackButton: boolean;
  onBackClick: () => void;
}

//WorkflowHeader
export interface WorkflowHeaderProps {
  title?: string;
  description?: string;
}

//StartFlow
export interface StartFlowProps {
  data: CustomNodeData;
  Position: typeof Position;
  handleStyle: {
    width: string;
    height: string;
    background: string;
    border: string;
    opacity: number;
  };
  selected: boolean;
  formattedLines: string[] | undefined;
}

//CommentPropsBox
export interface CommentPropsBox {
  username: string;
  content: string;
  previewLength?: number;
}

//DefaltNode
export interface DefaltNodeProps {
  selected: boolean;
  setOpenSelectBox?: Dispatch<SetStateAction<boolean>>;
}

//EventActionTabs
export interface EventActionTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

//FormPanel
export interface FormPanelProps {
  onAddNode: (params: any) => void;
  tempNodeConnect: any;
  setTempNodeConnect: any;
}

//NewWorkflowPanel
export interface NewWorkflowPanelProps {
  newWorkFlowFun: (title: string, description: string) => void;
}

//NodeItemsList
export interface NodeItemsListProps {
  menu: any[];
  onItemSelect: (element: any) => void;
}

//SelectionSummary
export interface SelectionSummaryProps {
  tempNodeConnect: any;
}

//StatePanel
export interface StatePanelProps {
  onAddNode: (params: any) => void;
  setTempNodeConnect: any;
}

//TriggerItem
export interface TriggerItemProps {
  title: string;
  description?: string;
  type?: string;
  onClick: () => void;
  isSelected?: boolean;
  avatar?: string;
  selectedValue?: string;
}
