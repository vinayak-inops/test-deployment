import { Handle, Position } from "reactflow";
import StateSelectDropdown from "./state-select-dropdown";
import { CircleNodeProps } from "@/type/work-flow/create-work-flow/props";

function CircleNode({
  data,
  getHandleType,
  handleStyle,
  formattedLines,
  deleteFunction,
  updateNodeValue,
  addNewState,
  setSelectedId
}: CircleNodeProps) {
  return (
    <div onClick={()=>{
      setSelectedId(data.presentNodeId)
    }} className="relative">
      <div
        className={`flex flex-col items-center relative mb-2 ${
          data?.selected ? "pb-[0.1px]" : "pb-0"
        }`}
      >
        <div>
          <div
            className={`
          px-3 py-2 
          rounded-2xl 
          bg-gradient-to-b 
          border-[1px] 
          shadow-lg
          ${data?.modeOfSelect === "select" ? "from-green-400 to-green-500" : data?.modeOfSelect === "path" ? "border-green-700" : "border-[#34476701] from-blue-400 to-blue-500"}
          min-w-[100px]
          max-w-[100px]
          min-h-[35px]
          flex items-center justify-center
        `}
            style={{
              boxShadow: data?.selected
                ? "0 6px 12px rgba(54,210,111, 0.2)"
                : data?.stateData.pathDirection == "positive"
                  ? "0 6px 12px rgba(0, 110, 255, 0.2)"
                  : "0 8px 16px rgba(233, 30, 99, 0.25)",
            }}
            onClick={() => {
              addNewState();
            }}
          >
            <Handle
              type={getHandleType("left")}
              position={Position.Left}
              style={handleStyle}
              id="left"
            />
            <div className="flex flex-col items-center justify-center text-white w-full">
              {formattedLines?.map((line, index) => (
                <p
                  key={index}
                  className="text-[7px] text-center whitespace-nowrap"
                >
                  {line}
                </p>
              ))}
            </div>
            <Handle
              type={getHandleType("right")}
              position={Position.Right}
              style={handleStyle}
              id="right"
            />
          </div>
        </div>
      </div>
      {data?.modeOfSelect === "select" && (
        <StateSelectDropdown
        data={data}
          deleteFunction={deleteFunction}
          updateNodeValue={updateNodeValue}
          addNewState={addNewState}
        />
      )}
    </div>
  );
}

export default CircleNode;
