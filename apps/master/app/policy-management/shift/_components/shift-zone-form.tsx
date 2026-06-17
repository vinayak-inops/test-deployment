"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Check, Trash2, Filter, Search as SearchIcon, FileText, Building2, Users } from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@repo/ui/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useSession } from "next-auth/react";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch";
import { SingleSelectField } from "@/components/fields/single-select-field";
import { SubFormTitle } from "@/components/header/sub-form-title";
import { FormActionsFooter } from "@/components/footer/form-actions-footer";
import { createShiftZoneSchema, type ShiftZoneFormData } from "./schemas/shift-zone-form-schema";

export type FormData = ShiftZoneFormData;

interface ShiftZoneFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initialData?: Partial<FormData & { _id?: { $oid: string } | string; shift?: any[]; createdOn?: string; createdBy?: string }>;
  isEdit?: boolean;
  existingShiftGroupCodes: string[];
  existingShiftGroupNames: string[];
}

type OptionItem = {
  code: string;
  name: string;
  locationCodes?: string[];
};

const toOptions = (
  list: any[],
  codeKeys: string[],
  nameKeys: string[],
  locationKeys?: string[]
): OptionItem[] =>
  (Array.isArray(list) ? list : [])
    .map((item: any) => {
      const code = codeKeys.map((key) => item?.[key]).find((value) => typeof value === "string" && value.trim()) || "";
      const name = nameKeys.map((key) => item?.[key]).find((value) => typeof value === "string" && value.trim()) || "";
      const locationCodes = locationKeys?.map((key) => item?.[key]).find((value) => Array.isArray(value)) || [];
      return { code, name, locationCodes };
    })
    .filter((item) => item.code);

export default function ShiftZoneForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit,
  existingShiftGroupCodes = [],
  existingShiftGroupNames = [],
}: ShiftZoneFormProps) {
  const tenantCode = useGetTenantCode();
  const { data: session } = useSession();
  const [showErrors, setShowErrors] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [addCategorySearchTerm, setAddCategorySearchTerm] = useState("");
  const [categorySearchField, setCategorySearchField] = useState<"code" | "name">("name");
  const [categoryPage, setCategoryPage] = useState(1);

  const schema = useMemo(
    () =>
      createShiftZoneSchema({
        existingShiftGroupCodes,
        existingShiftGroupNames,
        isEdit,
        initialShiftGroupCode: (initialData as any)?.shiftGroupCode || "",
        initialShiftGroupName: (initialData as any)?.shiftGroupName || "",
      }),
    [existingShiftGroupCodes, existingShiftGroupNames, initialData, isEdit]
  );

  const {
    watch,
    setValue,
    reset,
    trigger,
    clearErrors,
    setError,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      shiftGroupCode: "",
      shiftGroupName: "",
      subsidiary: { subsidiaryCode: "", subsidiaryName: "" },
      location: { locationCode: "", locationName: "" },
      employeeCategory: [],
    },
  });

  const criteriaRequests = useMemo(
    () => [{ field: "tenantCode", operator: "is", value: tenantCode }],
    [tenantCode]
  );

  const { arrayData: subsidiariesArray, loading: subsidiariesLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const { arrayData: locationsArray, loading: locationsLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests,
    arrayField: "location",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const { arrayData: employeeCategoriesArray, loading: employeeCategoriesLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests,
    arrayField: "employeeCategories",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });

  const subsidiaries = useMemo(
    () => toOptions(subsidiariesArray, ["subsidiaryCode", "code", "id"], ["subsidiaryName", "name", "title"], ["locationCode"]),
    [subsidiariesArray]
  );
  const locations = useMemo(
    () => toOptions(locationsArray, ["locationCode", "code", "id"], ["locationName", "name", "title"]),
    [locationsArray]
  );
  const employeeCategories = useMemo(
    () =>
      toOptions(
        employeeCategoriesArray,
        ["employeeCategoryCode", "categoryCode", "code", "id"],
        ["employeeCategoryName", "categoryName", "name", "title"]
      ),
    [employeeCategoriesArray]
  );

  const selectedSubsidiaryCode = watch("subsidiary.subsidiaryCode");
  const selectedLocationCode = watch("location.locationCode");
  const selectedCategories = watch("employeeCategory") || [];
  const orgLoading = subsidiariesLoading || locationsLoading || employeeCategoriesLoading;

  const filteredLocations = useMemo(() => {
    const selectedSubsidiary = subsidiaries.find((item) => item.code === selectedSubsidiaryCode);
    const allowedLocationCodes = selectedSubsidiary?.locationCodes || [];
    if (allowedLocationCodes.length === 0) return locations;
    return locations.filter((item) => allowedLocationCodes.includes(item.code));
  }, [locations, selectedSubsidiaryCode, subsidiaries]);

  const selectedCategoryItems = useMemo(
    () =>
      selectedCategories.map((code: string) => {
        const found = employeeCategories.find((item) => item.code === code);
        return {
          code,
          name: found?.name || "Unknown",
        };
      }),
    [selectedCategories, employeeCategories]
  );

  const availableCategoryOptions = useMemo(
    () => employeeCategories.filter((item) => !selectedCategories.includes(item.code)),
    [employeeCategories, selectedCategories]
  );

  const pageSize = 5;

  const filteredSelectedCategories = useMemo(() => {
    const query = categorySearchTerm.toLowerCase().trim();
    if (!query) return selectedCategoryItems;
    return selectedCategoryItems.filter((item) => {
      if (categorySearchField === "code") return item.code.toLowerCase().includes(query);
      return item.name.toLowerCase().includes(query);
    });
  }, [selectedCategoryItems, categorySearchTerm, categorySearchField]);

  const paginatedSelectedCategories = useMemo(() => {
    const start = (categoryPage - 1) * pageSize;
    return filteredSelectedCategories.slice(start, start + pageSize);
  }, [filteredSelectedCategories, categoryPage]);

  const addFilteredCategoryOptions = useMemo(() => {
    const query = addCategorySearchTerm.toLowerCase().trim();
    if (!query) return availableCategoryOptions;
    return availableCategoryOptions.filter((item) => {
      if (categorySearchField === "code") return item.code.toLowerCase().includes(query);
      return item.name.toLowerCase().includes(query);
    });
  }, [availableCategoryOptions, addCategorySearchTerm, categorySearchField]);

  const allAddFilteredSelected =
    addFilteredCategoryOptions.length > 0 &&
    addFilteredCategoryOptions.every((item) => selectedCategories.includes(item.code));

  useEffect(() => {
    if (!isOpen) return;
    reset({
      shiftGroupCode: (initialData as any)?.shiftGroupCode || "",
      shiftGroupName: (initialData as any)?.shiftGroupName || "",
      subsidiary: {
        subsidiaryCode: (initialData as any)?.subsidiary?.subsidiaryCode || (initialData as any)?.subsidiaryCode || "",
        subsidiaryName: (initialData as any)?.subsidiary?.subsidiaryName || (initialData as any)?.subsidiaryName || "",
      },
      location: {
        locationCode: (initialData as any)?.location?.locationCode || (initialData as any)?.locationCode || "",
        locationName: (initialData as any)?.location?.locationName || (initialData as any)?.locationName || "",
      },
      employeeCategory: (initialData as any)?.employeeCategory || [],
    });
    setShowErrors(false);
    setAddCategoryOpen(false);
    setCategorySearchTerm("");
    setAddCategorySearchTerm("");
    setCategorySearchField("name");
    setCategoryPage(1);
  }, [initialData, isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedSubsidiaryCode) {
      if (selectedLocationCode) {
        setValue("location", { locationCode: "", locationName: "" }, { shouldValidate: true });
      }
      return;
    }
    const isCurrentLocationAllowed = filteredLocations.some((item) => item.code === selectedLocationCode);
    if (!isCurrentLocationAllowed && selectedLocationCode) {
      setValue("location", { locationCode: "", locationName: "" }, { shouldValidate: true });
    }
  }, [filteredLocations, isOpen, selectedLocationCode, selectedSubsidiaryCode, setValue]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSelectedCategories.length / pageSize));
    if (categoryPage > maxPage) setCategoryPage(maxPage);
  }, [filteredSelectedCategories.length, categoryPage]);

  useEffect(() => {
    if (addCategoryOpen) setAddCategorySearchTerm("");
  }, [addCategoryOpen]);

  const { post: postShiftZone, loading: postLoading, error: postError } = usePostRequest<any>({
    url: "validate",
    onSuccess: (data) => {
      const status = data?.status ?? data?.data?.status;
      if (!status) {
        const responseData =
          data && typeof data === "object" ? data?.data ?? data : data;
        const normalizeServerField = (fieldName: string) => {
          const fieldMap: Record<string, keyof FormData | "subsidiary.subsidiaryCode" | "location.locationCode"> = {
            shiftGroupCode: "shiftGroupCode",
            shiftGroupName: "shiftGroupName",
            employeeCategory: "employeeCategory",
            "subsidiary.subsidiaryCode": "subsidiary.subsidiaryCode",
            "location.locationCode": "location.locationCode",
          };
          if (fieldMap[fieldName]) return fieldMap[fieldName];
          if (fieldName.startsWith("subsidiary.")) return "subsidiary.subsidiaryCode";
          if (fieldName.startsWith("location.")) return "location.locationCode";
          return null;
        };

        setShowErrors(true);
        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return;
            if (typeof message !== "string" || !message.trim()) return;
            const normalizedField = normalizeServerField(fieldName);
            if (!normalizedField) return;
            setError(normalizedField as any, { type: "server", message });
          });
        }
        return;
      }

      onSubmit(data);
      onClose();
    },
    onError: (error) => {
      console.error("POST error:", error);
    },
  });

  const handleSave = async () => {
    setShowErrors(true);
    clearErrors();
    const valid = await trigger();
    if (!valid) return;

    const values = watch();
    await postShiftZone({
      tenant: tenantCode,
      action: isEdit ? "update" : "insert",
      id: isEdit && (initialData as any)?._id ? (initialData as any)._id : null,
      collectionName: "shift",
      event: "validate",
      ruleId: "shiftGroupValidator",
      data: {
        shiftGroupCode: isEdit ? (initialData as any)?.shiftGroupCode : values.shiftGroupCode,
        shiftGroupName: values.shiftGroupName,
        subsidiary: values.subsidiary,
        location: values.location,
        employeeCategory: values.employeeCategory || [],
        ...(isEdit
          ? {}
          : {
              organizationCode: tenantCode,
              tenantCode,
              createdOn: new Date().toISOString(),
              createdBy: session?.user?.name || "",
              shift:[]
            }),
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !postLoading) onClose();
      }}
    >
      <div className="flex w-full max-w-5xl flex-col bg-transparent">
        <Card className="flex max-h-[90vh] w-full flex-col overflow-hidden border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
            <h2 className="text-base font-semibold text-gray-700">
              {isEdit ? "Edit Shift Group" : "Create Shift Group"} - Organization
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={postLoading}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              aria-label="Close popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <CardContent className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
            {showErrors && Object.keys(errors).length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Please fix highlighted fields before saving.
              </div>
            )}

            <div className="space-y-3">
              <SubFormTitle title="Shift Identity" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Shift Group Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={watch("shiftGroupCode") || ""}
                    onChange={(e) => setValue("shiftGroupCode", e.target.value, { shouldValidate: true })}
                    placeholder="Enter shift group code"
                    readOnly={Boolean(isEdit)}
                    className={showErrors && errors.shiftGroupCode?.message ? "border-red-500" : ""}
                  />
                  {showErrors && errors.shiftGroupCode?.message && (
                    <p className="text-xs text-red-600">{errors.shiftGroupCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Shift Group Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={watch("shiftGroupName") || ""}
                    onChange={(e) => setValue("shiftGroupName", e.target.value, { shouldValidate: true })}
                    placeholder="Enter shift group name"
                    className={showErrors && errors.shiftGroupName?.message ? "border-red-500" : ""}
                  />
                  {showErrors && errors.shiftGroupName?.message && (
                    <p className="text-xs text-red-600">{errors.shiftGroupName.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <SubFormTitle title="Organization Mapping" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SingleSelectField
                  id="shift-subsidiary"
                  label="Subsidiary"
                  required
                  placeholder="Select subsidiary"
                  value={watch("subsidiary.subsidiaryCode") || ""}
                  onChange={(value) => {
                    const selected = subsidiaries.find((item) => item.code === value);
                    setValue("subsidiary", { subsidiaryCode: value, subsidiaryName: selected?.name || "" }, { shouldValidate: true });
                    setValue("location", { locationCode: "", locationName: "" }, { shouldValidate: true });
                  }}
                  options={subsidiaries.map((item) => ({ value: item.code, label: item.name }))}
                  errorMessage={showErrors ? errors.subsidiary?.subsidiaryCode?.message : undefined}
                  allowOnlyProvidedOptions
                  showOnlyValueInTrigger
                  disabled={orgLoading}
                />

                <SingleSelectField
                  id="shift-location"
                  label="Location"
                  required
                  placeholder={!selectedSubsidiaryCode ? "Select subsidiary first" : "Select location"}
                  value={watch("location.locationCode") || ""}
                  onChange={(value) => {
                    const selected = filteredLocations.find((item) => item.code === value);
                    setValue("location", { locationCode: value, locationName: selected?.name || "" }, { shouldValidate: true });
                  }}
                  options={filteredLocations.map((item) => ({ value: item.code, label: item.name }))}
                  errorMessage={showErrors ? errors.location?.locationCode?.message : undefined}
                  allowOnlyProvidedOptions
                  showOnlyValueInTrigger
                  disabled={!selectedSubsidiaryCode || orgLoading}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <SubFormTitle title="Employee Categories" />
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <div className="flex rounded-lg border bg-muted/50">
                    <div className="flex w-40 items-center rounded-l-lg border-r bg-background px-3 py-2">
                      <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Select value={categorySearchField} onValueChange={(value: "code" | "name") => setCategorySearchField(value)}>
                        <SelectTrigger className="h-6 w-full border-none bg-transparent p-0 text-sm font-medium text-foreground shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="code">Code</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-1 items-center rounded-r-lg bg-background">
                      <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          autoComplete="off"
                          value={categorySearchTerm}
                          onChange={(e) => setCategorySearchTerm(e.target.value)}
                          placeholder={`Search by ${categorySearchField}...`}
                          className="h-10 rounded-none border-none bg-transparent py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>

                  {addCategoryOpen && (
                    <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                        <div className="flex bg-muted/50 rounded-lg border">
                          <div className="flex-1 flex items-center bg-background rounded-l-lg">
                            <div className="relative flex-1">
                              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder={`Search by ${categorySearchField === "code" ? "code" : "name"}...`}
                                value={addCategorySearchTerm}
                                onChange={(e) => setAddCategorySearchTerm(e.target.value)}
                                className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAddCategoryOpen(false)}
                            className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                            aria-label="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="border rounded-lg bg-white">
                          <Command shouldFilter={false} className="rounded-lg">
                            {addFilteredCategoryOptions.length > 0 && (
                              <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (allAddFilteredSelected) {
                                      setValue(
                                        "employeeCategory",
                                        selectedCategories.filter(
                                          (code: string) =>
                                            !addFilteredCategoryOptions.some((option) => option.code === code)
                                        ),
                                        { shouldValidate: true }
                                      );
                                    } else {
                                      const merged = [...selectedCategories];
                                      addFilteredCategoryOptions.forEach((option) => {
                                        if (!merged.includes(option.code)) merged.push(option.code);
                                      });
                                      setValue("employeeCategory", merged, { shouldValidate: true });
                                    }
                                  }}
                                  className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                >
                                  <Check
                                    className={`h-4 w-4 rounded-sm border ${
                                      allAddFilteredSelected
                                        ? "opacity-100 text-green-600 border-green-500"
                                        : "opacity-70 text-transparent border-gray-300"
                                    }`}
                                  />
                                  <span>Select all ({addFilteredCategoryOptions.length})</span>
                                </button>
                              </div>
                            )}
                            <CommandList className="max-h-[200px]">
                              <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                                No categories found.
                              </CommandEmpty>
                              <CommandGroup>
                                {addFilteredCategoryOptions.map((item) => {
                                  const isSelected = selectedCategories.includes(item.code);
                                  return (
                                    <CommandItem
                                      key={item.code}
                                      value={`${item.code}-${item.name}`}
                                      onSelect={() => {
                                        if (isSelected) {
                                          setValue(
                                            "employeeCategory",
                                            selectedCategories.filter((code: string) => code !== item.code),
                                            { shouldValidate: true }
                                          );
                                        } else {
                                          setValue("employeeCategory", [...selectedCategories, item.code], {
                                            shouldValidate: true,
                                          });
                                        }
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 rounded-sm border ${
                                          isSelected
                                            ? "opacity-100 text-green-600 border-green-500"
                                            : "opacity-70 text-transparent border-gray-300"
                                        }`}
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{item.name || "N/A"}</div>
                                        <div className="text-xs text-gray-500">Code: {item.code}</div>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={() => setAddCategoryOpen((prev) => !prev)}
                  className="h-10 whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700"
                  disabled={orgLoading}
                >
                  Add Categories
                </Button>
              </div>

              {showErrors && errors.employeeCategory && (
                <p className="text-xs text-red-500">{errors.employeeCategory.message}</p>
              )}

              <div className="border rounded-lg bg-slate-50/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                        Category Code
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                        Category Name
                      </TableHead>
                      <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSelectedCategories.length > 0 ? (
                      paginatedSelectedCategories.map((item) => (
                        <TableRow
                          key={item.code}
                          className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                        >
                          <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                            {item.code}
                          </TableCell>
                          <TableCell className="py-1.5 text-sm text-gray-900">{item.name}</TableCell>
                          <TableCell className="py-1.5 pr-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                              onClick={() =>
                                setValue(
                                  "employeeCategory",
                                  selectedCategories.filter((code: string) => code !== item.code),
                                  { shouldValidate: true }
                                )
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                          No categories selected. Click &quot;Add Categories&quot; to select categories.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {filteredSelectedCategories.length > pageSize && (
                  <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                    <p className="text-[11px] text-gray-500">
                      Showing{" "}
                      <span className="font-semibold">
                        {Math.min((categoryPage - 1) * pageSize + 1, filteredSelectedCategories.length)}-
                        {Math.min(categoryPage * pageSize, filteredSelectedCategories.length)}
                      </span>{" "}
                      of <span className="font-semibold">{filteredSelectedCategories.length}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        disabled={categoryPage === 1}
                        onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                      >
                        Prev
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        disabled={categoryPage * pageSize >= filteredSelectedCategories.length}
                        onClick={() =>
                          setCategoryPage((p) => (p * pageSize >= filteredSelectedCategories.length ? p : p + 1))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {postError && <div className="text-sm text-red-600">{postError.message}</div>}
          </CardContent>

          <FormActionsFooter
            isViewMode={false}
            isValid={isValid}
            showErrors={showErrors}
            errorCount={Object.keys(errors).length}
            postLoading={postLoading || orgLoading}
            onSave={handleSave}
            onPreviousTab={onClose}
          />
        </Card>
      </div>
    </div>
  );
}
