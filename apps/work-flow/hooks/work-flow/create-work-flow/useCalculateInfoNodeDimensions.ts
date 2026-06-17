import { useCallback } from "react";

export const useCalculateInfoNodeDimensions = () => {
  return useCallback((values: any) => {
    // Helper function to split text into lines with a maximum width of 25 characters
    const processText = (text: string) => {
      const words = text.toString().split(" ");
      const lines: string[] = [];
      let currentLine = "";
      words.forEach((word) => {
        if ((currentLine + " " + word).length <= 25) {
          currentLine = currentLine ? `${currentLine} ${word}` : word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // Calculate the total number of lines required for all values
    const totalLines = Object.values(values).reduce(
      (acc: number, value: any) => {
        return acc + processText(value.toString()).length;
      },
      0
    );

    // Define base dimensions for the info node
    const baseWidth = 70;
    const baseHeight = Math.max(40, totalLines * 16 + 16);

    return { width: baseWidth, height: baseHeight };
  }, []);
};