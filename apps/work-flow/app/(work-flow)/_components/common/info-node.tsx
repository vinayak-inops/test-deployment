"use client"
import React, { useMemo } from 'react'
import { Handle, Position } from 'reactflow'

// Define a type for the selectedValue to avoid indexing issues
interface SelectedValueType {
  [key: string]: string;
}

function InfoNode({
  data,
  getHandleType,
  handleStyle,
}: any) {
  const nodeValue={
    title:data.stateData.state.title,
    action:data.stateData?.event?.title,
    event:data.stateData?.action?.title,
    guard:data.stateData?.guard?.title
  }
  
  // Function to wrap text and calculate lines
  const processText = (text: string) => {
    const words = text.toString().split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    words.forEach(word => {
      if ((currentLine + ' ' + word).length <= 25) {
        currentLine = currentLine ? `${currentLine} ${word}` : word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })
    if (currentLine) lines.push(currentLine)
    return lines
  }

  // Calculate dimensions and total lines using useMemo to prevent unnecessary recalculations
  const { dimensions, calculatedHeight } = useMemo(() => {
    // Properly handle the case where selelectedValue could be a string or an object or undefined
    let stateData: SelectedValueType = {};
    
    if (nodeValue && typeof nodeValue === 'object' && !nodeValue.title) {
      stateData = nodeValue as SelectedValueType;
    }
    
    const values = Object.keys(stateData).map((key) => stateData[key])
    
    const totalLines = values.reduce((acc, value) => {
      return acc + processText(value).length
    }, 0)

    const baseWidth = 120
    const baseHeight = 20
    const lineHeight = 8
    const padding = 16
    
    const calculatedHeight = Math.max(baseHeight, (totalLines * lineHeight) + padding)
    
    return {
      dimensions: {
        width: `${baseWidth}px`,
        minHeight: `${calculatedHeight}px`,
      },
      calculatedHeight,
      totalLines,
      values,
      stateData
    }
  }, [nodeValue, processText])

  // Calculate the margin offset
  const marginOffset = useMemo(() => {
    return `${calculatedHeight / 2 - 5 / 2}px`
  }, [calculatedHeight])

  // Get the selectedValue from the useMemo hook to use in rendering
  const { stateData } = useMemo(() => {
    let stateData: SelectedValueType = {};
    
    if (nodeValue && typeof nodeValue === 'object') {
      stateData = nodeValue as SelectedValueType;
    }
    
    return { stateData };
  }, [nodeValue])

  return (
    <div 
      style={{ marginTop: `-${marginOffset}` }}
      className={`flex flex-col items-center relative ${data?.selected ? "pb-[0.1px]" : "pb-0"}`}
    >
      <div>
        <div
          className={`px-2 py-2 shadow-md rounded-xl border-dotted bg-gray-800 border-[1px] 
          ${data?.selected  ? "from-green-400 to-green-500":data?.stateData.pathDirection==="positive"?"from-gray-700 to-gray-800":"bg-[#E91E63] "}
          ${data?.modeOfSelect === "select" ? "border-green-700" : data?.modeOfSelect === "path" ? "border-green-700" : "border-white"}
          `}
          style={dimensions}
        >
          <Handle
            type={getHandleType("left")}
            position={Position.Left}
            style={handleStyle}
            id="left"
          />
          {/* <div className='flex justify-center'>
          <Image src="/image/icon/message.png" width={20} height={20} alt=''/>
          </div> */}
          <ul className="text-white h-full flex flex-col justify-center list-none p-0">
            {Object.keys(stateData).map((key, i) => {
              const textLines = processText(stateData[key])
              if(key!="title"){
                return (
                  <li key={key} className="text-[7px] relative">
                    <span className="font-bold absolute">{i} </span>
                    {textLines.map((line, lineIndex) => (
                      <div className='ml-3' key={lineIndex}>
                        {line}
                        {lineIndex < textLines.length - 1 && <br />}
                      </div>
                    ))}
                  </li>
                )
              }
            })}
          </ul>
          <Handle
            type={getHandleType("right")}
            position={Position.Right}
            style={handleStyle}
            id="right"
          />
        </div>
      </div>
    </div>
  )
}

export default InfoNode