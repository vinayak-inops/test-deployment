import React from 'react'

function HFiveTag({ textvalue, classname = "" }: { textvalue: string; classname?: string }) {
  return (
    <h5 className={`text-lg font-semibold mb-1 ${classname}`}>{textvalue}</h5>
  )
}

export default HFiveTag