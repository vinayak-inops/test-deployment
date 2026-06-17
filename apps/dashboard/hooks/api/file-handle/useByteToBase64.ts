import { useState } from 'react'
import axios from 'axios'
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"

interface ByteToBase64Result {
  success: boolean
  bytes?: Uint8Array
  objectUrl?: string
  error?: string
  fileType?: string
}

interface UseByteToBase64Options {
  onSuccess?: (result: ByteToBase64Result) => void
  onError?: (error: string) => void
}

export const useByteToBase64 = (options: UseByteToBase64Options = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ByteToBase64Result | null>(null)
  
  const { token } = useAuthToken()
  const { onSuccess, onError } = options

  const fetchByteArray = async (serverPath: string, fileType: string): Promise<ByteToBase64Result> => {
    if (!serverPath || !token) {
      const errorMsg = 'Server path or authentication token is missing'
      setError(errorMsg)
      onError?.(errorMsg)
      return {
        success: false,
        error: errorMsg,
        fileType
      }
    }

    setLoading(true)
    setError(null)

    try {
      const fullPath = serverPath.startsWith('/app/documents/') ? serverPath : `${serverPath}`
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/query/attendance/document?path=${encodeURIComponent(fullPath)}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          withCredentials: true,
          timeout: 30000,
          responseType: 'arraybuffer'
        }
      )

      const bytes = new Uint8Array(response.data)
      const blob = new Blob([bytes], { type: fileType })
      const objectUrl = URL.createObjectURL(blob)

      const byteResult: ByteToBase64Result = {
        success: true,
        bytes,
        objectUrl,
        fileType
      }

      setResult(byteResult)
      onSuccess?.(byteResult)
      
      return byteResult

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch byte array'
      setError(errorMsg)
      onError?.(errorMsg)
      
      const errorResult: ByteToBase64Result = {
        success: false,
        error: errorMsg,
        fileType
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
    fetchByteArray,
    loading,
    error,
    result,
    reset
  }
}

export default useByteToBase64
