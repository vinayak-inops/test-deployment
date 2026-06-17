"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Badge } from "@repo/ui/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/ui/dropdown-menu"
import { Plus, Trash2, CreditCard, Star, Calendar, ChevronDown, ChevronUp, MoreVertical } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { GeneratePassPopup } from "./generate-pass-popup"
import { SuccessPopup } from "./success-popup"

interface CardItem {
  cardNumber: string
  workOrderNumber: string
  issueDate: string
  expiryDate: string
  isPrimaryCard: boolean
  isActive: boolean
}
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";

interface CordsGeneratePassProps {
  formData: any
  onFormDataChange: (data: any) => void
  onNextTab: () => void
  onPreviousTab: () => void
  mode: "add" | "edit" | "view"
  auditStatus: any
  auditStatusFormData: any
  setAuditStatus: (data: any) => void
  setAuditStatusFormData: (data: any) => void
  activeTab: string
  statusShower: any
  onPdfFileReady?: () => void
  onShowDownloadProgress?: any
  downloadProgress?: {
    updateProgress: (progress: number, message?: string) => void
    setComplete: () => void
    setError: (error: string) => void
  }
}

function CordsGeneratePass({
  formData,
  onFormDataChange,
  onNextTab,
  onPreviousTab,
  mode,
  auditStatus,
  auditStatusFormData,
  setAuditStatus,
  setAuditStatusFormData,
  activeTab,
  statusShower,
  onPdfFileReady,
  onShowDownloadProgress,
  downloadProgress
}: CordsGeneratePassProps) {
  const tenantCode = useGetTenantCode()
  const [cards, setCards] = useState<CardItem[]>(
    formData.cards || []
  )
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showPoliceVerificationPopup, setShowPoliceVerificationPopup] = useState(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0)
  const [generatedFileId, setGeneratedFileId] = useState<string | null>(null)
  // Fixed maximum expiry date caps per card (after validation)
  const [expiryCaps, setExpiryCaps] = useState<(string | undefined)[]>([])
  
  // State for managing view mode
  const [showAllSecurityPasses, setShowAllSecurityPasses] = useState(false)

  // Get work order data from auditStatusFormData.workOrder
  const workOrderData = auditStatusFormData?.workOrder || []

  // Initialize with existing data
  useEffect(() => {
    if (formData.cards && formData.cards.length > 0) {
      setCards(formData.cards)
    } else {
      // Always ensure at least one card record exists
      setCards([{
        cardNumber: "",
        workOrderNumber: "",
        issueDate: "",
        expiryDate: "",
        isPrimaryCard: true,
        isActive: false
      }])
    }
  }, [formData.cards])

  const addNewCard = () => {
    const newCard: CardItem = {
      cardNumber: "",
      workOrderNumber: "",
      issueDate: "",
      expiryDate: "",
      isPrimaryCard: false,
      isActive: false
    }
    const updatedCards = [...cards, newCard]
    setCards(updatedCards)

    // Update parent form data
    const parentFormattedCards = updatedCards.map((card: any) => ({
      ...card,
      issueDate: card.issueDate || '',
      expiryDate: card.expiryDate || ''
    }));
    onFormDataChange({ cards: parentFormattedCards });
  }

  const removeCard = (index: number) => {
    // Prevent removing the first card record (index 0)
    if (index === 0) {
      return
    }
    const updatedCards = cards.filter((_, i) => i !== index)
    setCards(updatedCards)

    // Update parent form data
    const parentFormattedCards = updatedCards.map((card: any) => ({
      ...card,
      issueDate: card.issueDate || '',
      expiryDate: card.expiryDate || ''
    }));
    onFormDataChange({ cards: parentFormattedCards });
  }

  const updateCard = (index: number, field: keyof CardItem, value: string | boolean) => {
    const updatedCards = [...cards]

    // If setting this card as primary, unset others
    if (field === "isPrimaryCard" && value === true) {
      updatedCards.forEach((card, i) => {
        if (i !== index) {
          card.isPrimaryCard = false
        }
      })
    }

    // Update the card with the new value
    updatedCards[index] = {
      ...updatedCards[index],
      [field]: value
    }

    setCards(updatedCards)

    // Update parent form data
    const parentFormattedCards = updatedCards.map((card: any) => ({
      ...card,
      issueDate: card.issueDate || '',
      expiryDate: card.expiryDate || ''
    }));
    onFormDataChange({ cards: parentFormattedCards });
  }

  // Specific function to handle manual date changes
  const handleManualDateChange = (index: number, field: "issueDate" | "expiryDate", value: string) => {

    // Clamp expiryDate within [issueDate, expiryCap] if applicable
    let nextValue = value;
    if (field === "expiryDate") {
      const cap = expiryCaps[index];
      const issue = cards[index]?.issueDate || "";
      const toDate = (s: string) => (s ? new Date(s) : undefined);
      const valD = toDate(nextValue);
      const capD = toDate(cap || "");
      const issueD = toDate(issue);
      if (valD && issueD && valD < issueD) {
        nextValue = issue;
      }
      if (valD && capD && valD > capD) {
        nextValue = cap as string;
      }
    }

    // Create a new cards array with the updated value (after clamping)
    const updatedCards = [...cards];
    
    updatedCards[index] = {
      
      ...updatedCards[index],
      
      [field]: nextValue
      
    };


    // Update local state
    setCards(updatedCards);

    // Also update parent form data
    const parentFormattedCards = updatedCards.map((card: any) => ({
      ...card,
      issueDate: card.issueDate || '',
      expiryDate: card.expiryDate || ''
    }));

    onFormDataChange({ cards: parentFormattedCards });
  }

  // Helper function to get selected work order data
  const getSelectedWorkOrder = (workOrderNumber: string) => {
    return workOrderData?.find((wo: any) => wo.workOrderNumber === workOrderNumber);
  };

  // Helper function to convert date format from legacy dd-mm-yyyy to yyyy-mm-dd
  const getDateForInput = (dateString: string) => {
    if (!dateString) return undefined;

    // If already in yyyy-mm-dd format, return as is
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
        return dateString;
      }
    }

    // Convert from dd-mm-yyyy to yyyy-mm-dd
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        // Format: dd-mm-yyyy -> yyyy-mm-dd
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    // If it's a valid date string, try to parse and format
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return undefined;
  };

  // Helper function to format date for display (yyyy-mm-dd)
  const formatDateForDisplay = (dateString: string | undefined) => {
    if (!dateString) return '';

    // If already in yyyy-mm-dd format, return as is
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
        return dateString;
      }
    }

    // Convert from dd-mm-yyyy to yyyy-mm-dd
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        // Format: dd-mm-yyyy -> yyyy-mm-dd
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    // Try to parse as a date and format to yyyy-mm-dd
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return dateString;
  };

  const handleWorkOrderChange = (index: number, workOrderNumber: string) => {

    // Find the selected work order from workOrderData
    const selectedWorkOrder = getSelectedWorkOrder(workOrderNumber);

    if (selectedWorkOrder) {
      // Auto-populate dates based on work order effective dates
      // Use effectiveFrom and effectiveTo from workOrder
      let contractFrom = '';
      let contractTo = '';

      try {
        // Handle effectiveFrom date
        if (selectedWorkOrder.effectiveFrom) {
          if (selectedWorkOrder.effectiveFrom.includes('-')) {
            const parts = selectedWorkOrder.effectiveFrom.split('-');
            if (parts.length === 3) {
              if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                // Format: dd-mm-yyyy -> convert to yyyy-mm-dd
                contractFrom = `${parts[2]}-${parts[1]}-${parts[0]}`;
              } else if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
                // Format: yyyy-mm-dd -> use as is
                contractFrom = selectedWorkOrder.effectiveFrom;
              }
            }
          } else {
            // Try to parse as Date object
            const date = new Date(selectedWorkOrder.effectiveFrom);
            if (!isNaN(date.getTime())) {
              contractFrom = date.toISOString().split('T')[0];
            }
          }
        }

        // Handle effectiveTo date
        if (selectedWorkOrder.effectiveTo) {
          if (selectedWorkOrder.effectiveTo.includes('-')) {
            const parts = selectedWorkOrder.effectiveTo.split('-');
            if (parts.length === 3) {
              if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                // Format: dd-mm-yyyy -> convert to yyyy-mm-dd
                contractTo = `${parts[2]}-${parts[1]}-${parts[0]}`;
              } else if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
                // Format: yyyy-mm-dd -> use as is
                contractTo = selectedWorkOrder.effectiveTo;
              }
            }
          } else {
            // Try to parse as Date object
            const date = new Date(selectedWorkOrder.effectiveTo);
            if (!isNaN(date.getTime())) {
              contractTo = date.toISOString().split('T')[0];
            }
          }
        }
      } catch (error) {
        console.error('Error converting dates:', error);
      }

      // Enhanced Police Verification Logic - STRICT VALIDATION
      // This logic implements the following steps:
      // 1. Check if policeVerification array exists and has data
      // 2. Find all active verifications (isActive: true)
      // 3. Select the last active verification (most recent)
      // 4. Check if current date falls within verification period
      // 5. Calculate Issue Date: MAX(workOrder.effectiveFrom, policeVerification.verificationDate)
      // 6. Calculate Expiry Date: MIN(workOrder.effectiveTo, policeVerification.nextVerificationDate)
      // 7. Validate that Issue Date < Expiry Date
      // 8. BLOCK card creation if ANY validation fails
      
      let calculatedIssueDate = '';
      let calculatedExpiryDate = '';
      let policeVerificationValid = false;
      let validationMessage = '';

      if (auditStatusFormData?.policeVerification && auditStatusFormData.policeVerification.length > 0) {

        // Find all active police verifications
        const activeVerifications = auditStatusFormData.policeVerification.filter(
          (verification: any) => verification.isActive === true
        );


        if (activeVerifications.length > 0) {
          // Get the last active verification (most recent)
          const lastActiveVerification = activeVerifications[activeVerifications.length - 1];

          // Check if current date falls within verification period
          const currentDate = new Date();
          const verificationDate = new Date(lastActiveVerification.verificationDate);
          const nextVerificationDate = new Date(lastActiveVerification.nextVerificationDate);

          if (currentDate >= verificationDate && currentDate <= nextVerificationDate) {
            policeVerificationValid = true;

            // Calculate Issue Date: Compare workOrder.effectiveFrom vs policeVerification.verificationDate
            // Select the LARGER (more recent) date
            const workOrderFromDate = new Date(contractFrom);
            const policeVerificationDate = new Date(lastActiveVerification.verificationDate);
            
            if (!isNaN(workOrderFromDate.getTime()) && !isNaN(policeVerificationDate.getTime())) {
              calculatedIssueDate = workOrderFromDate > policeVerificationDate 
                ? contractFrom 
                : lastActiveVerification.verificationDate;
              
            }

            // Calculate Expiry Date: Compare workOrder.effectiveTo vs policeVerification.nextVerificationDate
            // Select the SMALLER (earlier) date - this ensures the card expires before either the work order ends or police verification expires
            const workOrderToDate = new Date(contractTo);
            const policeNextVerificationDate = new Date(lastActiveVerification.nextVerificationDate);
            
            if (!isNaN(workOrderToDate.getTime()) && !isNaN(policeNextVerificationDate.getTime())) {
              // Use the earlier date between work order end and police verification expiry
              calculatedExpiryDate = workOrderToDate < policeNextVerificationDate 
                ? contractTo 
                : lastActiveVerification.nextVerificationDate;
              
            }

            // Validate that Issue Date is before Expiry Date
            if (calculatedIssueDate && calculatedExpiryDate) {
              const issueDate = new Date(calculatedIssueDate);
              const expiryDate = new Date(calculatedExpiryDate);
              
              if (issueDate >= expiryDate) {
                console.warn('Calculated Issue Date is not before Expiry Date');
                validationMessage = 'Calculated Issue Date is not before Expiry Date. Cannot create card.';
                policeVerificationValid = false;
              }
            }
          } else {
            validationMessage = 'Current date is outside police verification period. Cannot create card.';
            policeVerificationValid = false;
          }
        } else {
          validationMessage = 'No active police verifications found. Cannot create card.';
          policeVerificationValid = false;
        }
      } else {
        validationMessage = 'No police verification data found. Cannot create card.';
        policeVerificationValid = false;
      }

      // Check if police verification is valid before proceeding
      if (!policeVerificationValid) {
        console.error('Police verification validation failed:', validationMessage);
        
        // Clear the work order selection and show error
        const updatedCard = {
          ...cards[index],
          workOrderNumber: '',
          issueDate: '',
          expiryDate: ''
        };

        const updatedCards = [...cards];
        updatedCards[index] = updatedCard;
        setCards(updatedCards);

        // Update parent form data
        const parentFormattedCards = updatedCards.map((card: any) => ({
          ...card,
          issueDate: card.issueDate || '',
          expiryDate: card.expiryDate || ''
        }));

        onFormDataChange({ cards: parentFormattedCards });

        // Show error alert
        alert(`❌ Card Creation Blocked: ${validationMessage}\n\nPlease ensure you have valid police verification data before creating security passes.`);
        return; // Exit early, don't create the card
      }

      // Use calculated dates (police verification is valid)
      const finalIssueDate = calculatedIssueDate;
      const finalExpiryDate = calculatedExpiryDate;
      
      // Create updated card data with calculated dates (Police Verification + Work Order logic)
      const updatedCard = {
        ...cards[index],
        workOrderNumber: workOrderNumber,
        issueDate: finalIssueDate,
        expiryDate: finalExpiryDate
      };


      // Update local state immediately
      const updatedCards = [...cards];
      updatedCards[index] = updatedCard;
      setCards(updatedCards);
      
      // Set fixed expiry cap for this card
      setExpiryCaps(prev => {
        const copy = [...prev];
        copy[index] = finalExpiryDate;
        return copy;
      });

      // Also update parent form data with the same format
      const parentFormattedCards = updatedCards.map((card: any) => ({
        ...card,
        issueDate: card.issueDate || '',
        expiryDate: card.expiryDate || ''
      }));

      onFormDataChange({ cards: parentFormattedCards });

    } else {
      // Clear dates if no work order found
      const updatedCard = {
        ...cards[index],
        workOrderNumber: workOrderNumber,
        issueDate: '',
        expiryDate: ''
      };

      const updatedCards = [...cards];
      updatedCards[index] = updatedCard;
      setCards(updatedCards);
      
      // Clear expiry cap when no work order / invalid selection
      setExpiryCaps(prev => {
        const copy = [...prev];
        copy[index] = undefined;
        return copy;
      });

      const parentFormattedCards = updatedCards.map((card: any) => ({
        ...card,
        issueDate: card.issueDate || '',
        expiryDate: card.expiryDate || ''
      }));
      onFormDataChange({ cards: parentFormattedCards });
    }
  }

  const isFormValid = () => {
    return cards.every(card =>
      card.cardNumber &&
      card.workOrderNumber &&
      card.issueDate &&
      card.expiryDate &&
      card.isActive !== undefined
    )
  }

  const { post: postCordsGeneratePass } = usePostRequest({
    url: "contract_employee",
    onSuccess: (data) => {
      // Show success popup
      setShowSuccessPopup(true);
    },
    onError: (error) => {
      console.error("Error saving cards:", error)
    }
  })

  // Post to generate security pass and receive fileId
  const { post: postSecurityPass } = usePostRequest<any>({
    url: "securityPasses",
    onSuccess: (data: any) => {
      try {
        const fileId = data?.[0]?._id || data?.[0]?.id || data?._id || data?.id
        if (fileId) {
          setGeneratedFileId(fileId)
        }
        setShowPoliceVerificationPopup(true)
      } catch (error) {
        console.error("Error processing securityPasses response:", error)
        setShowPoliceVerificationPopup(true)
      }
    },
    onError: (error: any) => {
      console.error("❌ Security pass generation error:", error)
      alert("Failed to initiate security pass generation. Please try again.")
    },
  })

  const handleSave = () => {
    if (isFormValid()) {
      const flatData = {
        cards: cards
      };

      const json = {
        tenant: tenantCode,
        action: "insert",
        id: auditStatusFormData._id,
        collectionName: "contract_employee",
        data: {
          ...auditStatusFormData,
          ...flatData,
        }
      }
      postCordsGeneratePass(json)
    }
  }

  const generateCardNumber = (index: number) => {
    const baseNumber = "CARD"
    const paddedIndex = String(index + 1).padStart(3, '0')
    return `${baseNumber}${paddedIndex}`
  }

  const getCardStatus = (effectiveTo: string) => {
    if (!effectiveTo) return { status: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100' }

    const expiryDate = new Date(effectiveTo)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (expiryDate < now) {
      return { status: 'Expired', color: 'text-red-600', bgColor: 'bg-red-100' }
    } else if (expiryDate < thirtyDaysFromNow) {
      return { status: 'Expiring Soon', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    } else {
      return { status: 'Valid', color: 'text-green-600', bgColor: 'bg-green-100' }
    }
  }

  const handleGeneratePass = (selectedCardIndex: number) => {
    handleSave()
    // Reset previous file id
    setGeneratedFileId(null)

    // Get the selected card
    const selectedCard = cards[selectedCardIndex]

    // Show download progress popup immediately when generation starts
    if (onShowDownloadProgress) {
      onShowDownloadProgress();
    } else {
    }

    // Open popup immediately; it will wait for fileId
    setSelectedCardIndex(selectedCardIndex)
    setShowPoliceVerificationPopup(true)

    // Build payload for security pass generation
    const employeeID = auditStatusFormData?.employee?.employeeID || 
      auditStatusFormData?.employeeID || 
      auditStatusFormData?.employee?.id || 
      auditStatusFormData?._id || ""

    const jsonData = {
      tenant: tenantCode,
      action: "insert",
      collectionName: "securityPasses",
      event: "reportGeneration",
      id: "",
      data: {
        status: "Initiated",
        workflowName: "SecurityPass",
        organizationCode: tenantCode,
        tenantCode: tenantCode,
        employeeID: String(employeeID),
        securityPass: {
          cardNumber: selectedCard?.cardNumber || "",
          cardType: selectedCard?.isPrimaryCard ? "Primary" : "Secondary",
          issueDate: selectedCard?.issueDate || "",
          expiryDate: selectedCard?.expiryDate || "",
          workOrderNumber: selectedCard?.workOrderNumber || "",
          isPrimaryCard: Boolean(selectedCard?.isPrimaryCard),
          isActive: Boolean(selectedCard?.isActive),
        },
        uploadedBy: "user",
        createdOn: new Date().toISOString(),
      }
    }

    // Fire request
    postSecurityPass(jsonData)
  }

  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-xl shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Security Pass Management</CardTitle>
                <p className="text-blue-100 text-base">
                  Manage Security Passes, validity periods, and primary card designation
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-8">
          {/* Security Passes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Security Pass Records ({(cards?.length || 0)})
              </h3>
              <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="px-2 py-2 h-10 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg">
                        <DropdownMenuItem 
                          onClick={() => setShowAllSecurityPasses(!showAllSecurityPasses)}
                          className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
                        >
                          {showAllSecurityPasses ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2 text-gray-600" />
                              View Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                              View All ({(cards?.length || 0)} passes)
                            </>
                          )}
                        </DropdownMenuItem>
                        {/* Future menu items can be added here */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                {mode !== "view" && (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="px-2 py-2 h-10 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg">
                        <DropdownMenuItem 
                          onClick={() => setShowAllSecurityPasses(!showAllSecurityPasses)}
                          className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
                        >
                          {showAllSecurityPasses ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2 text-gray-600" />
                              View Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                              View All ({(cards?.length || 0)} passes)
                            </>
                          )}
                        </DropdownMenuItem>
                        {/* Future menu items can be added here */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      type="button"
                      onClick={addNewCard}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Card
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Compulsory Note */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> At least one Security Pass record is compulsory and cannot be removed.
              </p>
            </div>

            {/* Work Order Information Note */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-blue-800">
                  <strong>Work Order Selection:</strong> All available work orders are shown with their effective date ranges.
                </p>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                • All work orders are available for selection<br/>
                • Date range is displayed for each work order option<br/>
                • Total work orders: {workOrderData.length}<br/>
                • Select any work order to auto-populate dates based on police verification logic
              </div>
            </div>

            {/* Police Verification Requirement Note */}
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-orange-800">
                  <strong>Police Verification Required:</strong> You must have valid police verification data with active status to create security passes.
                </p>
              </div>
              <div className="mt-2 text-xs text-orange-600">
                • Police verification must exist and have data<br/>
                • At least one verification must be marked as active<br/>
                • Current date must fall within verification period<br/>
                • Card creation will be blocked if any requirement is not met
              </div>
            </div>

            <div className="space-y-4">
              {cards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No Security Pass records found</p>
                  <p className="text-sm">At least one card record is required</p>
                </div>
              ) : (
                [...cards].reverse().map((card, originalIndex) => {
                  const actualIndex = cards.length - 1 - originalIndex
                  
                  // Show only the most recently added security pass (first in reverse order) when showAllSecurityPasses is false
                  if (!showAllSecurityPasses && originalIndex !== 0) {
                    return null
                  }
                  
                  const cardStatus = getCardStatus(card.expiryDate)
                  const selectedWorkOrder = getSelectedWorkOrder(card.workOrderNumber)

                  return (
                    <div key={actualIndex} className={`p-6 border rounded-xl bg-gray-50/50 ${card.isPrimaryCard ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-md font-medium text-gray-800">
                            {actualIndex === cards.length - 1 ? "Latest Security Pass (last update)" : `Security Pass #${actualIndex + 1}`}
                          </h4>
                          {actualIndex === 0 && (
                            <Badge className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              Compulsory
                            </Badge>
                          )}
                          {card.isPrimaryCard && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Primary
                            </Badge>
                          )}
                          <Badge className={`${card.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} text-xs px-2 py-1 rounded-full flex items-center gap-1`}>
                            <div className={`w-2 h-2 rounded-full ${card.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            {card.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {/* Police Verification Status */}
                          {card.workOrderNumber && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Police Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${cardStatus.bgColor} ${cardStatus.color} text-xs px-2 py-1 rounded-full`}>
                            {cardStatus.status}
                          </Badge>
                          {mode !== "view" && actualIndex > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCard(actualIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="group">
                          <Label className="text-sm font-medium text-gray-700">Work Order <span className="text-red-500">*</span></Label>
                          <select
                            value={card.workOrderNumber}
                            onChange={(e) => handleWorkOrderChange(actualIndex, e.target.value)}
                            disabled={mode === "view"}
                            className="h-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-300 group-hover:border-gray-300 bg-white px-3 w-full"
                            required
                          >
                            <option value="">Select Work Order</option>
                            {workOrderData?.map((wo: any, woIndex: number) => (
                              <option key={woIndex} value={wo.workOrderNumber}>
                                {wo.workOrderNumber} - {wo.deployment?.contractor?.contractorName || wo.deployment?.contractor?.contractorCode || 'N/A'} 
                                ({formatDateForDisplay(wo.effectiveFrom)} to {formatDateForDisplay(wo.effectiveTo)})
                              </option>
                            ))}
                          </select>
                          
                          
                          {/* Auto-population Status */}
                          {card.workOrderNumber && selectedWorkOrder && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 text-xs text-green-700">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>✅ Dates auto-populated using Police Verification + Work Order logic</span>
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                Contract: {formatDateForDisplay(selectedWorkOrder.effectiveFrom)} to {formatDateForDisplay(selectedWorkOrder.effectiveTo)}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                🔒 Police verification validated - Card creation allowed
                              </div>
                              <div className="text-xs text-orange-600 mt-1">
                                ⚠️ Expiry Date = MIN(Work Order End, Police Verification Expiry)
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="group">
                          <Label className="text-sm font-medium text-gray-700">Pass Number <span className="text-red-500">*</span></Label>
                          <Input
                            value={card.cardNumber}
                            onChange={(e) => updateCard(actualIndex, "cardNumber", e.target.value)}
                            disabled={mode === "view"}
                            placeholder={generateCardNumber(actualIndex)}
                            className="h-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-300 group-hover:border-gray-300 bg-white"
                            required
                          />
                        </div>

                        <div className="group">
                          <Label className="text-sm font-medium text-gray-700">Primary Card</Label>
                          <div className="flex items-center space-x-2 h-10">
                          <Checkbox
                            checked={card.isPrimaryCard}
                            onCheckedChange={(checked) => updateCard(actualIndex, "isPrimaryCard", checked as boolean)}
                              disabled={mode === "view"}
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label className="text-sm font-medium cursor-pointer">
                              Mark as Primary
                            </Label>
                          </div>
                        </div>

                        <div className="group">
                          <Label className="text-sm font-medium text-gray-700">Active Status</Label>
                          <div className="flex items-center space-x-2 h-10">
                          <Checkbox
                            checked={card.isActive}
                            onCheckedChange={(checked) => updateCard(actualIndex, "isActive", checked as boolean)}
                              disabled={mode === "view"}
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <Label className="text-sm font-medium cursor-pointer">
                              Mark as Active
                            </Label>
                          </div>
                        </div>

                        <div className="group">
                          <Label className="text-sm font-medium text-gray-700">Issue Date <span className="text-red-500">*</span></Label>
                          <Input
                            type="date"
                            value={card.issueDate || ''}
                            onChange={(e) => handleManualDateChange(actualIndex, "issueDate", e.target.value)}
                            disabled={mode === "view"}
                            min={(() => {
                              // Must not be before work order effective start date
                              if (selectedWorkOrder?.effectiveFrom) {
                                const effectiveStartDate = getDateForInput(selectedWorkOrder.effectiveFrom);
                                if (effectiveStartDate) {
                                  return effectiveStartDate;
                                }
                              }
                              return undefined;
                            })()}
                            max={(() => {
                              // Must not exceed work order effective end date
                              if (selectedWorkOrder?.effectiveTo) {
                                const effectiveEndDate = getDateForInput(selectedWorkOrder.effectiveTo);
                                if (effectiveEndDate) {
                                  return effectiveEndDate;
                                }
                              }
                              return undefined;
                            })()}
                            className="h-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-300 group-hover:border-gray-300 bg-white"
                            required
                          />
                          {/* Validation Help Text */}
                          {selectedWorkOrder && (
                            <div className="mt-2 text-xs text-blue-600">
                              <p>📅 Must be between {formatDateForDisplay(selectedWorkOrder.effectiveFrom)} and {formatDateForDisplay(selectedWorkOrder.effectiveTo)}</p>
                              <p className="mt-1">💡 You can manually adjust the date within this range after auto-population</p>
                            </div>
                          )}
                        </div>

                        <div className="group">
                          <Label className="text-sm font-medium text-gray-700">Expiry Date <span className="text-red-500">*</span></Label>
                          <Input
                            type="date"
                            value={card.expiryDate || ''}
                            onChange={(e) => handleManualDateChange(actualIndex, "expiryDate", e.target.value)}
                            disabled={mode === "view"}
                            min={card.issueDate || undefined}
                            max={expiryCaps[actualIndex] || (selectedWorkOrder?.effectiveTo ? getDateForInput(selectedWorkOrder.effectiveTo) : undefined)}
                            className="h-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-300 group-hover:border-gray-300 bg-white"
                            required
                          />
                          {/* Validation Help Text */}
                          {selectedWorkOrder && (
                            <div className="mt-2 text-xs text-blue-600">
                              <p>📅 Must be after {formatDateForDisplay(card.issueDate || '')} and before {formatDateForDisplay(selectedWorkOrder.effectiveTo)}</p>
                              <p className="mt-1">⚠️ Expiry Date = MIN(Work Order End, Police Verification Expiry)</p>
                              <p className="mt-1">💡 You can manually adjust the date within this range after auto-population</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contract Period Info */}
                      {selectedWorkOrder && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm text-blue-800">
                            <p className="font-medium">Contract Period:</p>
                            <p className="text-xs mt-1">
                              {formatDateForDisplay(selectedWorkOrder.effectiveFrom)} to {formatDateForDisplay(selectedWorkOrder.effectiveTo)}
                            </p>
                            <p className="text-xs mt-1 text-orange-600">
                              ⚠️ Card Expiry = MIN(Work Order End, Police Verification Expiry)
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Card Validity Info */}
                      {card.issueDate && card.expiryDate && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Card Validity Period:</span>
                            <span className={`font-medium ${cardStatus.color}`}>
                              {cardStatus.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDateForDisplay(card.issueDate)} to {formatDateForDisplay(card.expiryDate)}
                          </div>
                        </div>
                      )}

                      {/* Generate Pass Button */}
                      {
                        mode != "view" && (
                          <div className="mt-4">
                        <Button
                          type="button"
                          onClick={() => handleGeneratePass(actualIndex)}
                          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          Generate Pass
                        </Button>
                      </div>
                        )
                      }
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!mode.includes("view") && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              {onPreviousTab && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPreviousTab}
                  className="px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isFormValid() ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {isFormValid() ? 'Form is valid and ready to continue' : 'Please complete all required fields'}
                </span>
              </div>

              <Button
                type="button"
                onClick={handleSave}
                disabled={!isFormValid() || cards.length === 0}
                className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </Button>
            </div>
          </div>
        )}

      </CardContent>
      
      {/* Success Popup */}
      {showSuccessPopup && (
        <SuccessPopup
          isOpen={showSuccessPopup}
          onClose={() => setShowSuccessPopup(false)}
          title="Security Pass Generated Successfully!"
          message="Your Security Passes have been saved and are ready for use. You can now generate individual passes for each card."
        />
      )}

      {/* Police Verification Popup */}
      {showPoliceVerificationPopup && (
        <GeneratePassPopup
          statusShower={statusShower}
          onShowDownloadProgress={onShowDownloadProgress}
          onPdfFileReady={onPdfFileReady}
          isOpen={showPoliceVerificationPopup}
          onClose={() => setShowPoliceVerificationPopup(false)}
          fileId={generatedFileId}
          downloadProgress={downloadProgress}
        />
      )}
    </Card>
  )
}

export default CordsGeneratePass
