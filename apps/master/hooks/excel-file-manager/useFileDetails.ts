import { useMemo } from 'react';
import { useDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql";

interface TransformedFileDetails {
  _id: string;
  fileName: string;
  fileSize: string;
  workflowName: string;
  status: string;
  description: string;
  uploadedBy: string;
  createdOn: string;
}

export const useFileDetails = () => {
  const fileDetailsFields = {
    fields: [
      '_id',
      'fileName',
      'fileSize',
      'workflowName',
      'status',
      'description',
      'uploadedBy',
      'createdOn'
    ]
  };

  const { data, loading, error } = useDynamicQuery(
    fileDetailsFields,
    'files',              // collection
    'GetAllFileDetails',  // operationName
    'fetchAllFileDetails' // operationType
  );

  const transformedFileDetails = useMemo(() => {
    if (!data) return [];

    return data.map((file: any) => {
      // Format file size to KB/MB
      const fileSizeInKB = parseInt(file.fileSize) / 1024;
      const formattedFileSize = fileSizeInKB >= 1024 
        ? `${(fileSizeInKB / 1024).toFixed(2)} MB`
        : `${fileSizeInKB.toFixed(2)} KB`;

      // Format date to readable format
      const date = new Date(file.createdOn);
      const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // Remove __typename and transform the data
      const { __typename, ...rest } = file;
      return {
        ...rest,
        fileSize: formattedFileSize,
        createdOn: formattedDate
      } as TransformedFileDetails;
    });
  }, [data]);

  return {
    fileDetails: transformedFileDetails,
    loading,
    error
  };
}; 