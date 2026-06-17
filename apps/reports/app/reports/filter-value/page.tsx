'use client';

import React, { useState } from 'react';
import EmployeeValueFilter from './emplyee-value-filter';

// Sample organization data for demonstration
const sampleOrganizationData = {
  subsidiaries: [
    { value: 'sub1', label: 'Subsidiary 1', subsidiaryCode: 'sub1' },
    { value: 'sub2', label: 'Subsidiary 2', subsidiaryCode: 'sub2' },
    { value: 'sub3', label: 'Subsidiary 3', subsidiaryCode: 'sub3' }
  ],
  location: [
    { value: 'loc1', label: 'Location 1', locationCode: 'loc1' },
    { value: 'loc2', label: 'Location 2', locationCode: 'loc2' },
    { value: 'loc3', label: 'Location 3', locationCode: 'loc3' }
  ],
  divisions: [
    { value: 'div1', label: 'Division 1', divisionCode: 'div1', subsidiaryCode: 'sub1' },
    { value: 'div2', label: 'Division 2', divisionCode: 'div2', subsidiaryCode: 'sub1' },
    { value: 'div3', label: 'Division 3', divisionCode: 'div3', subsidiaryCode: 'sub2' },
    { value: 'div4', label: 'Division 4', divisionCode: 'div4', subsidiaryCode: 'sub2' }
  ],
  departments: [
    { value: 'dept1', label: 'Department 1', departmentCode: 'dept1', divisionCode: 'div1' },
    { value: 'dept2', label: 'Department 2', departmentCode: 'dept2', divisionCode: 'div1' },
    { value: 'dept3', label: 'Department 3', departmentCode: 'dept3', divisionCode: 'div2' },
    { value: 'dept4', label: 'Department 4', departmentCode: 'dept4', divisionCode: 'div3' }
  ],
  subDepartments: [
    { value: 'subdept1', label: 'Sub Department 1', subDepartmentCode: 'subdept1', departmentCode: 'dept1' },
    { value: 'subdept2', label: 'Sub Department 2', subDepartmentCode: 'subdept2', departmentCode: 'dept1' },
    { value: 'subdept3', label: 'Sub Department 3', subDepartmentCode: 'subdept3', departmentCode: 'dept2' },
    { value: 'subdept4', label: 'Sub Department 4', subDepartmentCode: 'subdept4', departmentCode: 'dept3' }
  ],
  sections: [
    { value: 'sec1', label: 'Section 1', sectionCode: 'sec1', subDepartmentCode: 'subdept1' },
    { value: 'sec2', label: 'Section 2', sectionCode: 'sec2', subDepartmentCode: 'subdept1' },
    { value: 'sec3', label: 'Section 3', sectionCode: 'sec3', subDepartmentCode: 'subdept2' },
    { value: 'sec4', label: 'Section 4', sectionCode: 'sec4', subDepartmentCode: 'subdept3' }
  ],
  designations: [
    { value: 'des1', label: 'Designation 1', designationCode: 'des1', divisionCode: 'div1' },
    { value: 'des2', label: 'Designation 2', designationCode: 'des2', divisionCode: 'div1' },
    { value: 'des3', label: 'Designation 3', designationCode: 'des3', divisionCode: 'div2' },
    { value: 'des4', label: 'Designation 4', designationCode: 'des4', divisionCode: 'div3' }
  ],
  grades: [
    { value: 'grade1', label: 'Grade 1', gradeCode: 'grade1', designationCode: 'des1' },
    { value: 'grade2', label: 'Grade 2', gradeCode: 'grade2', designationCode: 'des1' },
    { value: 'grade3', label: 'Grade 3', gradeCode: 'grade3', designationCode: 'des2' },
    { value: 'grade4', label: 'Grade 4', gradeCode: 'grade4', designationCode: 'des3' }
  ]
};

export default function FilterValuePage() {
  const [currentFilters, setCurrentFilters] = useState<Record<string, string[]>>({});

  const handleFilterChange = (filters: Record<string, string[]>) => {
    setCurrentFilters(filters);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Value Filter Demo</h1>
          <p className="text-gray-600">
            This component demonstrates the hierarchical filter functionality with parent-child relationships.
          </p>
        </div>

        <EmployeeValueFilter
          organizationData={sampleOrganizationData}
          onFilterChange={handleFilterChange}
          initialFilters={currentFilters}
        />

        {/* Display current filters */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Filter Values</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(currentFilters).map(([fieldName, values]) => (
              <div key={fieldName} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {fieldName}
                </label>
                <div className="text-sm text-gray-600">
                  {values.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {values.map((value) => (
                        <span
                          key={value}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">No selection</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Use</h3>
          <div className="space-y-3 text-blue-800">
            <p className="text-sm">
              <strong>Left Side:</strong> Use checkboxes to select which filter parameters you want to apply.
            </p>
            <p className="text-sm">
              <strong>Right Side:</strong> The dropdowns follow a hierarchical structure:
            </p>
            <ul className="text-sm list-disc list-inside ml-4 space-y-1">
              <li><strong>Subsidiaries & Location:</strong> Always enabled (no parent required)</li>
              <li><strong>Divisions:</strong> Requires Subsidiaries selection</li>
              <li><strong>Departments:</strong> Requires Divisions selection</li>
              <li><strong>Sub Departments:</strong> Requires Departments selection</li>
              <li><strong>Sections:</strong> Requires Sub Departments selection</li>
              <li><strong>Designations:</strong> Requires Divisions selection</li>
              <li><strong>Grades:</strong> Requires Designations selection</li>
            </ul>
            <p className="text-sm mt-3">
              <strong>Note:</strong> When you change a parent selection, all child fields are automatically cleared to maintain data consistency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
