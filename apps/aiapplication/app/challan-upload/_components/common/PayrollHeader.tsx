interface PayrollHeaderProps {
    day: number
    month: string
    excelfilename: string
    workflowname: string
    time: string
  }
  
  export default function PayrollHeader({
    day,
    month,
    excelfilename,
    workflowname,
    time,
  }: PayrollHeaderProps) {
    return (
      <div className="flex items-center gap-4 ">
        {/* Date Badge */}
        <div className="flex flex-col items-center justify-center  rounded-full w-12 h-12">
          <div className="text-base font-bold bg-gray-100 p-2  rounded-lg">{day}</div>
          {/* <div className="text-xs font-semibold text-gray-600">{month.toUpperCase()}</div> */}
        </div>
  
        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center text-base font-semibold text-black gap-2">
            {/* <span>{countryFlag}</span> */}
            <span>{excelfilename}</span>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>{workflowname}</span>
            <span className="w-px h-4 bg-gray-300" />
            <span>{time}</span>
          </div>
        </div>
      </div>
    )
  }
  