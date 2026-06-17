"use client"

import React from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

type Slab = {
  from: number
  to: number
  amount: number
}

type ProfessionalTaxFormData = {
  country: string
  state: string
  effectiveFrom: string
  slabs: Slab[]
  applicableTo: string
}

interface WageProfessionalFormProps {
  onSubmit?: (data: ProfessionalTaxFormData) => void
  initialValues?: Partial<ProfessionalTaxFormData>
  mode?: "add" | "edit" | "view"
}

export default function WageProfessionalForm({
  onSubmit,
  initialValues,
  mode = "add",
}: WageProfessionalFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfessionalTaxFormData>({
    defaultValues: {
      country: initialValues?.country || "INDIA",
      state: initialValues?.state || "Karnataka",
      effectiveFrom: initialValues?.effectiveFrom || "2025-12-16",
      slabs: initialValues?.slabs || [{ from: 0, to: 0, amount: 0 }],
      applicableTo: initialValues?.applicableTo || "All",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "slabs",
  })

  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"

  const onFormSubmit = (data: ProfessionalTaxFormData) => {
    onSubmit?.(data)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Professional Tax Configuration</CardTitle>
        <CardDescription>
          Configure country, state, effective date, tax slabs, and applicability
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Country and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-red-500">*</span>
              </Label>
              <Input
                id="country"
                {...register("country", { required: "Country is required" })}
                placeholder="Enter country"
                disabled={isViewMode}
                className={errors.country ? "border-red-500" : ""}
              />
              {errors.country && (
                <p className="text-sm text-red-500">{errors.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">
                State <span className="text-red-500">*</span>
              </Label>
              <Input
                id="state"
                {...register("state", { required: "State is required" })}
                placeholder="Enter state"
                disabled={isViewMode}
                className={errors.state ? "border-red-500" : ""}
              />
              {errors.state && (
                <p className="text-sm text-red-500">{errors.state.message}</p>
              )}
            </div>
          </div>

          {/* Effective From and Applicable To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">
                Effective From <span className="text-red-500">*</span>
              </Label>
              <Input
                id="effectiveFrom"
                type="date"
                {...register("effectiveFrom", { required: "Effective from date is required" })}
                disabled={isViewMode}
                className={errors.effectiveFrom ? "border-red-500" : ""}
              />
              {errors.effectiveFrom && (
                <p className="text-sm text-red-500">{errors.effectiveFrom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicableTo">
                Applicable To <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="applicableTo"
                control={control}
                rules={{ required: "Applicable to is required" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isViewMode}
                  >
                    <SelectTrigger className={errors.applicableTo ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select applicable to" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.applicableTo && (
                <p className="text-sm text-red-500">{errors.applicableTo.message}</p>
              )}
            </div>
          </div>

          {/* Tax Slabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Tax Slabs <span className="text-red-500">*</span>
              </Label>
              {!isViewMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ from: 0, to: 0, amount: 0 })}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Slab
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Slab {index + 1}</h4>
                    {!isViewMode && fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`slabs.${index}.from`}>From Amount</Label>
                      <Input
                        id={`slabs.${index}.from`}
                        type="number"
                        {...register(`slabs.${index}.from` as const, {
                          required: "From amount is required",
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                        disabled={isViewMode}
                        className={errors.slabs?.[index]?.from ? "border-red-500" : ""}
                      />
                      {errors.slabs?.[index]?.from && (
                        <p className="text-sm text-red-500">
                          {errors.slabs[index]?.from?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`slabs.${index}.to`}>To Amount</Label>
                      <Input
                        id={`slabs.${index}.to`}
                        type="number"
                        {...register(`slabs.${index}.to` as const, {
                          required: "To amount is required",
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                        disabled={isViewMode}
                        className={errors.slabs?.[index]?.to ? "border-red-500" : ""}
                      />
                      {errors.slabs?.[index]?.to && (
                        <p className="text-sm text-red-500">
                          {errors.slabs[index]?.to?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`slabs.${index}.amount`}>Tax Amount</Label>
                      <Input
                        id={`slabs.${index}.amount`}
                        type="number"
                        {...register(`slabs.${index}.amount` as const, {
                          required: "Tax amount is required",
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                        disabled={isViewMode}
                        className={errors.slabs?.[index]?.amount ? "border-red-500" : ""}
                      />
                      {errors.slabs?.[index]?.amount && (
                        <p className="text-sm text-red-500">
                          {errors.slabs[index]?.amount?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No slabs added. Click "Add Slab" to add a tax slab.
              </p>
            )}
          </div>

          {/* Form Actions */}
          {!isViewMode && (
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button type="submit" className="min-w-[120px]">
                {isEditMode ? "Update" : "Submit"}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}