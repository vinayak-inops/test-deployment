import React from "react";

const TestDisplay = ({ field, register, error, setValue, eventHandler, valueUpdate }: any) => {

  return <div>
    <p>{field.value}</p>
  </div>;
};

export default TestDisplay;
