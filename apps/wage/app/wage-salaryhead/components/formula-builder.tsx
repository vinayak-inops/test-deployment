"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"


type SalaryHeadOption = { name: string; code: string }
type Operation =
  | { comparator: "lessThan"; value: number; then: number }
  | { comparator: "greaterThan"; value: number; then: number }
  | { comparator: "equalTo"; value: number; then: number }
  | { comparator: "between"; from: number; to: number; then: number }

type FormulaBuilderProps = {
  salaryHeads?: SalaryHeadOption[]
  expression?: string
  variables?: string[]
  operation?: Operation[]
  onFormulaChange?: (data: { expression: string; variables: string[]; operation: Operation[] }) => void
}

export default function FormulaBuilder({ 
  salaryHeads = [],
  expression: propExpression = "",
  variables: propVariables = [],
  operation: propOperation = [],
  onFormulaChange
}: FormulaBuilderProps) {
  const [standardFormula, setStandardFormula] = useState("")
  const [salaryHead, setSalaryHead] = useState("")

  const salaryHeadNames = useMemo(() => (salaryHeads || []).map(sh => sh.name), [salaryHeads])

  useEffect(() => {
    if (!salaryHead && salaryHeadNames.length > 0) {
      setSalaryHead(salaryHeadNames[0])
    }
  }, [salaryHead, salaryHeadNames])
  
  // JSON fields for standard formula - sync with props
  const [expression, setExpression] = useState(propExpression)
  const [selectedSalaryHeads, setSelectedSalaryHeads] = useState<string[]>(propVariables || [])
  const [operations, setOperations] = useState<Operation[]>(propOperation || [])
  const [isSyntaxVerified, setIsSyntaxVerified] = useState(false)

  // Sync with props when they change (only if different to avoid loops)
  useEffect(() => {
    if (propExpression !== expression) {
      setExpression(propExpression)
    }
    if (JSON.stringify(propVariables) !== JSON.stringify(selectedSalaryHeads)) {
      setSelectedSalaryHeads(propVariables || [])
    }
    if (JSON.stringify(propOperation) !== JSON.stringify(operations)) {
      setOperations(propOperation || [])
    }
  }, [propExpression, propVariables, propOperation])

  // Helper function to update state and notify parent
  const updateFormulaData = (updates: { expression?: string; variables?: string[]; operation?: Operation[] }) => {
    const newExpression = updates.expression !== undefined ? updates.expression : expression
    const newVariables = updates.variables !== undefined ? updates.variables : selectedSalaryHeads
    const newOperation = updates.operation !== undefined ? updates.operation : operations
    
    setExpression(newExpression)
    setSelectedSalaryHeads(newVariables)
    setOperations(newOperation)
    
    if (onFormulaChange) {
      onFormulaChange({
        expression: newExpression,
        variables: newVariables,
        operation: newOperation
      })
    }
  }


  const calculatorButtons = [
    ["<-", "C"],
    ["7", "8", "9", "*", "/"],
    ["4", "5", "6", "+", "-"],
    ["1", "2", "3", "(", ")"],
    [".", "0"],
  ]



  const handleAddSalaryHeadToStandard = () => {
    const updatedSalaryHeads = !selectedSalaryHeads.includes(salaryHead)
      ? [...selectedSalaryHeads, salaryHead]
      : selectedSalaryHeads
    updateFormulaData({ variables: updatedSalaryHeads })
    setStandardFormula((prev) => prev + salaryHead)
    // Reset syntax verification when formula changes
    setIsSyntaxVerified(false)
  }

  const validateFormulaSyntax = (formula: string): { isValid: boolean; message: string } => {
    if (!formula.trim()) {
      return { isValid: false, message: "Formula cannot be empty" }
    }

    // Check for balanced parentheses
    let parenthesesCount = 0
    for (const char of formula) {
      if (char === "(") parenthesesCount++
      if (char === ")") parenthesesCount--
      if (parenthesesCount < 0) {
        return { isValid: false, message: "Unmatched closing parenthesis ')'" }
      }
    }
    if (parenthesesCount > 0) {
      return { isValid: false, message: "Unmatched opening parenthesis '('" }
    }

    // Check for consecutive operators
    const operators = ["+", "-", "*", "/", "=", ">", "<"]
    for (let i = 0; i < formula.length - 1; i++) {
      if (operators.includes(formula[i]) && operators.includes(formula[i + 1])) {
        return { isValid: false, message: `Invalid consecutive operators: '${formula[i]}${formula[i + 1]}'` }
      }
    }

    // Check for operators at the beginning or end
    if (operators.includes(formula[0]) && formula[0] !== "-") {
      return { isValid: false, message: "Formula cannot start with an operator (except minus sign)" }
    }
    if (operators.includes(formula[formula.length - 1])) {
      return { isValid: false, message: "Formula cannot end with an operator" }
    }

    // Check for invalid characters
    const validChars = /^[a-zA-Z0-9+\-*/().<>=\s]+$/
    if (!validChars.test(formula)) {
      return { isValid: false, message: "Formula contains invalid characters" }
    }

    // Check for empty parentheses
    if (formula.includes("()")) {
      return { isValid: false, message: "Empty parentheses '()' are not allowed" }
    }

    return { isValid: true, message: "Syntax is valid!" }
  }

  const handleCheckSyntax = () => {
    const formulaToCheck = standardFormula.trim() || expression.trim()
    if (!formulaToCheck) {
      alert("Standard Formula: Formula is empty. Please enter a formula to check.")
      setIsSyntaxVerified(false)
      return
    }

    const validation = validateFormulaSyntax(formulaToCheck)

    if (validation.isValid) {
      alert(`Standard Formula: ✓ ${validation.message}`)
      setIsSyntaxVerified(true)
      // Auto-populate expression field with current formula
      if (standardFormula.trim()) {
        updateFormulaData({ expression: standardFormula })
      }
    } else {
      alert(`Standard Formula: ✗ ${validation.message}`)
      setIsSyntaxVerified(false)
    }
  }

  const handleSave = () => {
    const formulaData = {
      type: "standard",
      standardFormula: standardFormula,
      // JSON fields for standard formula
      jsonFields: {
        expression,
        variables: selectedSalaryHeads,
        operation: operations
      }
    }
    alert("Formula saved successfully!")
  }

  const handleCancel = () => {
    setStandardFormula("")
    // Clear JSON fields
    setExpression("")
    setSelectedSalaryHeads([])
    setOperations([])
    setIsSyntaxVerified(false)
  }

  // Helper functions for JSON fields
  const removeSalaryHead = (salaryHeadToRemove: string) => {
    const updated = selectedSalaryHeads.filter(head => head !== salaryHeadToRemove)
    updateFormulaData({ variables: updated })
    // Also remove from standard formula
    setStandardFormula(prev => prev.replace(salaryHeadToRemove, ''))
  }

  const addOperation = () => {
    const newOps = [...operations, {
      comparator: "lessThan" as const,
      value: 0,
      then: 0
    }]
    updateFormulaData({ operation: newOps })
  }

  const removeOperation = (index: number) => {
    const newOps = operations.filter((_, i) => i !== index)
    updateFormulaData({ operation: newOps })
  }

  const updateOperation = (index: number, field: string, value: any) => {
    const newOps = operations.map((op, i) => {
      if (i !== index) return op
      
      // Handle comparator change - need to reconstruct the operation with correct shape
      if (field === "comparator") {
        const newComparator = value as Operation["comparator"]
        if (newComparator === "between") {
          return { comparator: "between", from: 0, to: 0, then: op.then } as Operation
        } else {
          return { comparator: newComparator, value: 0, then: op.then } as Operation
        }
      }
      
      // For other fields, update existing operation
      if (op.comparator === "between") {
        return { ...op, [field]: value } as Operation
      } else {
        return { ...op, [field]: value } as Operation
      }
    })
    updateFormulaData({ operation: newOps })
  }

  return (
    <>
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Standard Formula</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Standard Formula Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-formula">Current Formula :</Label>
                <Textarea
                  id="current-formula"
                  value={standardFormula}
                  readOnly
                  className="mt-1 bg-gray-50"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="salary-head">Salary Head</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={salaryHead} onValueChange={setSalaryHead}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {salaryHeadNames.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleAddSalaryHeadToStandard}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* JSON Fields Section */}
              <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                <div className="space-y-2">
                  <Label>Expression</Label>
                  <Input
                    value={expression}
                    onChange={e => updateFormulaData({ expression: e.target.value })}
                    placeholder="(Basic + 0.5*HRA + PF)*0.1"
                  />
                  <p className="text-xs text-muted-foreground">Enter the mathematical expression for calculation.</p>
                </div>

                <div className="space-y-2">
                  <Label>Variables</Label>
                  <Input
                    value={selectedSalaryHeads.join(", ")}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Selected salary heads will appear here"
                  />
                  <div className="flex flex-wrap gap-2">
                    {selectedSalaryHeads.map((head, index) => (
                      <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        <span>{head}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-blue-200"
                          onClick={() => removeSalaryHead(head)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Variables are automatically populated from selected salary heads.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Operations</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOperation}
                    >
                      Add Operation
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {operations.map((operation, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Operation {index + 1}</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Comparator</Label>
                            <Select
                              value={operation.comparator}
                              onValueChange={v => updateOperation(index, "comparator", v)}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select comparator" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lessThan">Less Than</SelectItem>
                                <SelectItem value="greaterThan">Greater Than</SelectItem>
                                <SelectItem value="equalTo">Equal To</SelectItem>
                                <SelectItem value="between">Between</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {operation.comparator === "between" ? (
                            <>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">From Value</Label>
                                <Input
                                  type="number"
                                  value={operation.from || 0}
                                  onChange={e => updateOperation(index, "from", Number(e.target.value))}
                                  className="h-10"
                                  placeholder="Min value"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">To Value</Label>
                                <Input
                                  type="number"
                                  value={operation.to || 0}
                                  onChange={e => updateOperation(index, "to", Number(e.target.value))}
                                  className="h-10"
                                  placeholder="Max value"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-600">Value</Label>
                              <Input
                                type="number"
                                value={operation.value || 0}
                                onChange={e => updateOperation(index, "value", Number(e.target.value))}
                                className="h-10"
                                placeholder="Enter value"
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Then Result</Label>
                            <Input
                              type="number"
                              value={operation.then}
                              onChange={e => updateOperation(index, "then", Number(e.target.value))}
                              className="h-10"
                              placeholder="Result value"
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeOperation(index)}
                            className="px-4 py-2"
                          >
                            Remove Operation
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Define conditional operations based on values.</p>
                </div>
              </div>
            </div>

            {/* Calculator Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2 max-w-xs">
                {calculatorButtons.flat().map((button, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (button === "C") {
                        setStandardFormula("")
                      } else if (button === "<-") {
                        setStandardFormula((prev) => prev.slice(0, -1))
                      } else {
                        setStandardFormula((prev) => prev + button)
                      }
                      // Reset syntax verification when formula changes
                      setIsSyntaxVerified(false)
                    }}
                    className="h-10"
                  >
                    {button}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCheckSyntax}>
                Check Syntax
              </Button>
              {isSyntaxVerified && (
                <span className="text-green-600 text-sm font-medium">✓ Syntax Verified</span>
              )}
              {!isSyntaxVerified && standardFormula && (
                <span className="text-orange-600 text-sm font-medium">⚠ Syntax Not Verified</span>
              )}
            </div>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

    </>
  )
}