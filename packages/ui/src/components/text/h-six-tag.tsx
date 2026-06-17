import React from 'react'

function HSixTag({ textvalue, classname = "" }: { textvalue: string; classname?: string }) {
  return (
    <h5 className={`text-[14px] font-semibold mb-0 ${classname}`}>{textvalue}</h5>
  )
}

export default HSixTag