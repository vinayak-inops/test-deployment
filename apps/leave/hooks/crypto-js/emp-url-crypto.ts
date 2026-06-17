"use client"

import CryptoJS from 'crypto-js'

// Encryption key (should be in environment variable in production)
const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY 

// Employee data type
export interface EmployeeData {
  employeeId: string
  _id: string
}

/**
 * Encrypt employee data (employeeId and _id) to URL-safe encrypted string
 * @param data - Object containing employeeId and _id
 * @returns Encrypted string safe for URL usage
 */
export const encryptEmployeeData = (data: EmployeeData): string => {
  if (!SECRET_KEY) {
    throw new Error('Encryption key is not configured. Please set NEXT_PUBLIC_ENCRYPTION_KEY environment variable.')
  }
  
  try {
    // Convert JSON object to string
    const jsonString = JSON.stringify(data)
    
    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString()
    
    // Convert to URL-safe base64 (replace + with -, / with _, remove = padding)
    const urlSafe = encrypted
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    return urlSafe
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt employee data')
  }
}

/**
 * Decrypt encrypted string back to employee data object
 * @param encryptedString - Encrypted string from URL or encrypted data
 * @returns Decrypted object containing employeeId and _id
 */
export const decryptEmployeeData = (encryptedString: string): EmployeeData => {
  if (!SECRET_KEY) {
    throw new Error('Encryption key is not configured. Please set NEXT_PUBLIC_ENCRYPTION_KEY environment variable.')
  }
  
  try {
    // Convert URL-safe base64 back to regular base64
    let base64 = encryptedString
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    // Add padding if needed (base64 requires padding)
    while (base64.length % 4) {
      base64 += '='
    }
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(base64, SECRET_KEY)
    
    // Convert to UTF-8 string
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8)
    
    if (!jsonString) {
      throw new Error('Decryption failed - invalid key or corrupted data')
    }
    
    // Parse back to JSON object
    const parsedData = JSON.parse(jsonString)
    
    // Validate the structure
    if (!parsedData.employeeId || !parsedData._id) {
      throw new Error('Decrypted data missing required fields')
    }
    
    return parsedData as EmployeeData
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt employee data')
  }
}
