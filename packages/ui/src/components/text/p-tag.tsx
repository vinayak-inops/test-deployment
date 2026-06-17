function Ptag({ textvalue, classname = "" }: { textvalue: string; classname?: string }) {
  return <p className={`text-[14px] text-gray-600 font-sans ${classname}`}>{textvalue}</p>;
}

export default Ptag;