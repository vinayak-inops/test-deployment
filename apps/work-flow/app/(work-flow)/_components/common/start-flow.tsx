import { StartFlowProps } from "@/type/work-flow/create-work-flow/props";
import { Handle } from "reactflow";



function StartFlow({
  data,
  Position,
  selected,
  formattedLines,
}: StartFlowProps) {
  const persistentHandleStyle = {
    width: "2px",
    height: "2px",
    background: "#2563eb",
    border: "0px solid white",
    opacity: selected ? 0: 0,
    zIndex: 0,
    cursor: "pointer",
  };

  return (
    <div
      className={`flex flex-col items-center relative ${data?.selected ? "pb-[0.1px]" : "pb-0"}`}
    >
      <div className="flex items-center">
        <div
          className={`
            px-2 py-2
            max-w-[100px]
            min-h-[35px]
            rounded-br-2xl
            rounded-tr-2xl
            rounded-tl-md
            rounded-bl-md
            bg-gradient-to-b from-blue-400 to-blue-500 shadow-lg
            flex items-center
            border-[0px]
            ${data?.selected ? "border-[#343439]" : "border-[#344767]"}
            break-words
            whitespace-normal
            relative
          `}
          style={{
            boxShadow: "0 6px 12px rgba(0, 110, 255, 0.2)",
          }}
        >
          <div className="flex flex-col items-center justify-center text-[#344767] w-full">
            {formattedLines?.map((line, index) => (
              <p
                key={index}
                className="text-[7px] text-center whitespace-nowrap text-white"
              >
                {line}
              </p>
            ))}
          </div>
        </div>
       
        <button
          className="w-3 h-3 flex items-center justify-center border-[0px] border-[#343439] rounded-full bg-gradient-to-b from-blue-400 to-blue-500 shadow-lg hover:bg-gray-100"
          // onClick={handleAddNode}
        >
          {/* <Plus size={8} className="text-white " /> */}
        </button>
        <Handle
          type="source"
          position={Position.Right}
          style={persistentHandleStyle}
          id="right"
          isConnectable={true}
          isConnectableStart={true}
          isConnectableEnd={false}
        />
      </div>
    </div>
  );
}

export default StartFlow;