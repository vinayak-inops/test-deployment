import { useState } from 'react'
import axios from 'axios'
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"

interface UploadResponse {
  success: boolean
  data?: any
  error?: string
  serverPath?: string
  fileName?: string
  fileType?: string
}

interface UseBulkDataFileUploadOptions {
  uploadPath?: string
  onSuccess?: (result: UploadResponse) => void
  onError?: (error: string) => void
}

export const useBulkDataFileUpload = (options: UseBulkDataFileUploadOptions = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResponse | null>(null)
  
  const { token } = useAuthToken()
  const { uploadPath = "contract_employee/wo_date", onSuccess, onError } = options

  const uploadFile = async (file: File, fileName?: string): Promise<UploadResponse> => {
    if (!file || !token) {
      const errorMsg = 'File or authentication token is missing'
      setError(errorMsg)
      onError?.(errorMsg)
      return {
        success: false,
        error: errorMsg,
        fileName: file?.name,
        fileType: file?.type
      }
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', uploadPath)

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/command/attendance/fileupload`,
        formData,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          withCredentials: true,
          timeout: 30000,
        }
      )

      const serverPath = response.data
      
      const uploadResult: UploadResponse = {
        success: true,
        data: response.data,
        serverPath,
        fileName: fileName || file.name,
        fileType: file.type
      }

      setResult(uploadResult)
      onSuccess?.(uploadResult)
      
      return uploadResult

    } catch (err: any) {
      const errorMsg = err.message || 'Upload failed'
      setError(errorMsg)
      onError?.(errorMsg)
      
      const errorResult: UploadResponse = {
        success: false,
        error: errorMsg,
        fileName: fileName || file.name,
        fileType: file.type
      }
      
      setResult(errorResult)
      return errorResult
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setLoading(false)
    setError(null)
    setResult(null)
  }

  return {
    uploadFile,
    loading,
    error,
    result,
    reset
  }
}

export default useBulkDataFileUpload
