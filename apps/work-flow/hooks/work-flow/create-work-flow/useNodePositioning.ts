import { Node } from 'reactflow';

export const useNodePositioning = (nodes: Node[], pathDirection?: 'positive' | 'down') => {
  const NODE_SPACING = 200;  // Horizontal spacing between nodes
  const VERTICAL_SPACING = 100;  // Vertical spacing between nodes

  // Helper function to get all nodes at a specific X coordinate
  const getNodesAtX = (x: number, tolerance: number = 5) => {
    return nodes.filter(node => 
      Math.abs(node.position.x - x) <= tolerance
    ).sort((a, b) => a.position.y - b.position.y);
  };

  // Find gaps between nodes at a specific X coordinate
  const findGapAtX = (x: number, proposedY: number, nodeHeight: number = 50) => {
    const nodesAtX = getNodesAtX(x);
    if (nodesAtX.length === 0) return proposedY;

    // Sort nodes by Y position
    const sortedNodes = [...nodesAtX].sort((a, b) => 
      pathDirection === 'positive' ? b.position.y - a.position.y : a.position.y - b.position.y
    );
    
    // Add buffer space around nodes
    const buffer = 40;
    const gaps: { start: number; end: number }[] = [];
    
    if (pathDirection === 'positive') {
      // Check space above first node when going up
      const firstNode = sortedNodes[0];
      if (firstNode.position.y - buffer > proposedY - VERTICAL_SPACING) {
        gaps.push({ 
          start: firstNode.position.y - VERTICAL_SPACING, 
          end: firstNode.position.y - buffer 
        });
      }

      // Check spaces between nodes going upward
      for (let i = 0; i < sortedNodes.length - 1; i++) {
        const currentNodeTop = sortedNodes[i].position.y - buffer;
        const nextNodeBottom = sortedNodes[i + 1].position.y + 
          (sortedNodes[i + 1].data.dimensions?.height || nodeHeight) + buffer;
        
        if (currentNodeTop - nextNodeBottom >= nodeHeight) {
          gaps.push({ start: nextNodeBottom, end: currentNodeTop });
        }
      }
    } else {
      // Original downward logic
      // Check space before first node
      if (sortedNodes[0].position.y - buffer > proposedY) {
        gaps.push({ start: proposedY, end: sortedNodes[0].position.y - buffer });
      }

      // Check spaces between nodes
      for (let i = 0; i < sortedNodes.length - 1; i++) {
        const currentNodeBottom = sortedNodes[i].position.y + 
          (sortedNodes[i].data.dimensions?.height || nodeHeight) + buffer;
        const nextNodeTop = sortedNodes[i + 1].position.y - buffer;
        
        if (nextNodeTop - currentNodeBottom >= nodeHeight) {
          gaps.push({ start: currentNodeBottom, end: nextNodeTop });
        }
      }

      // Check space after last node
      const lastNode = sortedNodes[sortedNodes.length - 1];
      const lastNodeBottom = lastNode.position.y + 
        (lastNode.data.dimensions?.height || nodeHeight) + buffer;
      gaps.push({ start: lastNodeBottom, end: lastNodeBottom + VERTICAL_SPACING });
    }

    // Find the best gap based on proximity to proposed Y
    let bestGap = gaps.reduce((best, gap) => {
      const gapMiddle = (gap.start + gap.end) / 2;
      const bestMiddle = (best.start + best.end) / 2;
      return Math.abs(gapMiddle - proposedY) < Math.abs(bestMiddle - proposedY) ? gap : best;
    }, gaps[0]);

    return bestGap ? (bestGap.start + bestGap.end) / 2 : proposedY;
  };

  // Check if a position would cause overlap
  const wouldOverlap = (x: number, y: number, nodeHeight: number = 50) => {
    const buffer = 40;
    return nodes.some(node => {
      const nodeRight = node.position.x + (node.data.dimensions?.width || 150);
      const nodeBottom = node.position.y + (node.data.dimensions?.height || nodeHeight);
      
      return (
        Math.abs(x - node.position.x) < NODE_SPACING - buffer &&
        y < nodeBottom + buffer &&
        y > node.position.y - buffer
      );
    });
  };

  // Main function to find next vertical position
  const findNextVerticalPosition = (
    targetX: number,
    parentY: number,
    direction?: 'positive' | 'down',
    nodeHeight: number = 50
  ) => {
    // First try to place in a straight line
    let proposedY = parentY;
    
    // If there's no overlap, keep it in line with parent
    if (!wouldOverlap(targetX, proposedY, nodeHeight)) {
      return proposedY;
    }

    // If direction is up, adjust the proposed Y position upward
    if (direction === 'positive') {
      proposedY -=250;
    } else {
      proposedY += VERTICAL_SPACING;
    }

    // If overlap exists, find the best gap
    return findGapAtX(targetX, proposedY, nodeHeight);
  };

  return {
    findNextVerticalPosition,
    NODE_SPACING,
    VERTICAL_SPACING
  };
};