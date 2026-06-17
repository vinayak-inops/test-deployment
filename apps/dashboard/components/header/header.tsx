"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { MoreVertical, LogOut, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { gql, useApolloClient, useQuery } from '@apollo/client'
import { useSelector } from "react-redux"
import type { RootState } from "@inops/store/src/store"
import { useGetTenantCode } from '@/hooks/useGetTenantCode'
import { useAuthToken } from '@repo/ui/hooks/auth/useAuthToken'
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"
import ProfileDrawer from "./profile-drawer"
import ContractProfileDrawer from "./contract-profile-drawer"
import ContractorProfileDrawer from "./contractor-profile-drawer"
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

// GraphQL query to fetch organization data
const FETCH_ALL_ORGANIZATION_QUERY = gql`
  query FetchAllOrganization($collection: String!, $tenantCode: String!) {
    fetchAllOrganization(collection: $collection, tenantCode: $tenantCode) {
      logoFileName
    }
  }
`

export default function Header({
    navItems,
    serviceName
}: {
    navItems: any
    serviceName: string
}) {
  const { data: session } = useSession()
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedProfileType, setSelectedProfileType] = useState<"company" | "contract" | "contractor">("company")
  const [employeeProfile, setEmployeeProfile] = useState<any>(null)
  const [profilePhoto, setProfilePhoto] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()
  const client = useApolloClient()
  const apiState = useSelector((state: RootState) => (state as any)?.api)
  const adminRole = useSelector((state: RootState) => (state as any)?.adminRole?.adminRole)
  const tenantCode = useGetTenantCode()
  const { token } = useAuthToken()
  const {
    fetchByteArray: fetchLogoBytes,
    loading: logoLoading,
    result: logoResult,
    reset: resetLogoFetch
  } = useByteToBase64()

  const getLogoMime = useCallback((path: string) => {
    const lower = path.toLowerCase()
    if (lower.endsWith(".png")) return "image/png"
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
    if (lower.endsWith(".webp")) return "image/webp"
    if (lower.endsWith(".svg")) return "image/svg+xml"
    return "application/octet-stream"
  }, [])

  // Memoize context to prevent unnecessary refetches
  const queryContext = useMemo(() => ({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }), [token])

  // Fetch organization data
  const {
    data: organizationData,
    error: organizationError,
    loading: organizationLoading,
    refetch: refetchOrganization
  } = useQuery(FETCH_ALL_ORGANIZATION_QUERY, {
    client,
    variables: {
      collection: "organization",
      tenantCode: tenantCode || "",
    },
    context: queryContext,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first', // Use cache-first to avoid unnecessary network requests
    notifyOnNetworkStatusChange: true,
    skip: !tenantCode || !token, // Skip if no tenantCode or no token
    onCompleted: (data) => {
      if (data?.fetchAllOrganization) {
      } else {
      }
    },
    onError: (error) => {
    }
  })

  // Refetch when tenantCode or token changes
  useEffect(() => {
    if (tenantCode && token) {
      // Only refetch if we have both values and query is not currently loading
      if (!organizationLoading) {
        refetchOrganization().catch((error) => {
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode, token])

  // Get logo filename from organization data
  // Handle both array and single object responses
  const organizationResult = organizationData?.fetchAllOrganization
  const logoFileName = Array.isArray(organizationResult) 
    ? organizationResult[0]?.logoFileName 
    : organizationResult?.logoFileName
  // Only use logo if it's not empty
  const hasValidLogo = logoFileName && logoFileName.trim() !== ""
  const defaultLogoSrc = "/images/logoiddion.png"
  const fallbackLogoSrc = hasValidLogo ? `/uploads/${logoFileName}` : defaultLogoSrc
  const logoSrcFromHook = logoResult?.objectUrl
  const resolvedLogoSrc = logoSrcFromHook || fallbackLogoSrc
  const { entitlementCode } = useKeyclockRoleInfo()
  const roleData = Array.isArray(apiState?.data) && apiState.data.length > 0 ? apiState.data[0] : adminRole
  const applicableOption = roleData?.applicableOption as string | undefined
  const applicableProfileType = useMemo<"company" | "contract" | "contractor" | null>(() => {
    if (applicableOption === "company_employee") return "company"
    if (applicableOption === "contract_employee") return "contract"
    if (applicableOption === "contractor") return "contractor"
    return null
  }, [applicableOption])
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

  useEffect(() => {
    if (applicableProfileType) {
      setSelectedProfileType(applicableProfileType)
    }
  }, [applicableProfileType])

  useEffect(() => {
    if (!logoFileName || !token) {
      resetLogoFetch()
      return
    }

    fetchLogoBytes(logoFileName, getLogoMime(logoFileName)).catch((error) => {
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoFileName, token])

  const languages = [
    { value: "en", label: "English", flag: "🇬🇧" },
    // { value: "es", label: "Español", flag: "🇪🇸" },
    // { value: "fr", label: "Français", flag: "🇫🇷" },
    // { value: "de", label: "Deutsch", flag: "🇩🇪" },
    // { value: "it", label: "Italiano", flag: "🇮🇹" },
    // { value: "pt", label: "Português", flag: "🇵🇹" },
    // { value: "hi", label: "हिन्दी", flag: "🇮🇳" },
    // { value: "zh", label: "中文", flag: "🇨🇳" },
    // { value: "ja", label: "日本語", flag: "🇯🇵" },
    // { value: "ko", label: "한국어", flag: "🇰🇷" },
    // { value: "ar", label: "العربية", flag: "🇸🇦" },
    // { value: "ru", label: "Русский", flag: "🇷🇺" },
  ]

  // Get user info
  const userName = session?.user?.name || ""
  const userEmail = session?.user?.email || ""
  const userImage = session?.user?.image
  const firstName = userName.split(" ")[0] || "J"
  const firstLetter = firstName.charAt(0).toUpperCase()

  // Options for the unified search dropdown
  const filterSections = [
    {
      label: "Quick filters",
      items: [
        { value: "all", label: "All results" },
        { value: "assessment-avg", label: "Assessment AVG" },
      ],
    },
    {
      label: "Available assessment reports",
      items: [
        { value: "dod-research-red", label: "DoD Research • Red Lab" },
        { value: "dod-research-purple", label: "DoD Research • Purple Lab" },
        { value: "dod-research-green", label: "DoD Research • Green Lab" },
        { value: "anonymized-avg", label: "Anonymized AVG • 6 units" },
      ],
    },
  ]

  // Keyboard shortcut: Ctrl + K focuses search and opens dropdown
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && (event.key === "k" || event.key === "K")) {
        event.preventDefault()
        setIsSearchDropdownOpen(true)
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

    // Handle logout
    const handleLogout = () => {
      router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/logout`)
    }
  
     // Handle profile
     const handleProfile = () => {
      setMenuOpen(false)
      setProfileOpen(true)
    }
  
    const handleSettings = () => {
      router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/master/permission?form=masterOrganization&entitlementCode=${entitlementCode}&mode=permissionview`)
    }

  return (
    <>
      <header className="w-full bg-gradient-to-r from-blue-50 via-white to-blue-50">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
        {/* Left Section with User Logo, Service Provider and Application Name */}
        <div className="flex items-center gap-4">
          {/* Organization Logo */}
          <div className="flex items-center">
            {hasValidLogo && (
              <img
                src={resolvedLogoSrc}
                alt="Organization Logo"
                className="w-[76px] h-[40px] bg-white backdrop-blur-sm p-1 rounded-lg object-contain"
              />
            )}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-blue-400/30" />

          {/* Service Provider and Application Info */}
          <div className="flex items-center gap-4">
            {/* Service Provider */}
            {/* <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <span className="text-white text-lg font-bold">I</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm leading-tight">INOPS</span>
                <span className="text-blue-100 text-xs">Service Provider</span>
              </div>
            </div> */}
            <div className="flex items-center">
              {logoLoading ? (
                <div className="w-[76px] h-[40px] rounded-lg bg-white/60 animate-pulse" />
              ) : (
                <img
                  src='/images/logoiddion.png'
                  alt="Organization Logo"
                  className="w-[76px] h-[40px] bg-white backdrop-blur-sm p-1 rounded-lg object-contain"
                  onError={(e) => {
                    e.currentTarget.src = defaultLogoSrc
                  }}
                />
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-blue-400/30" />

            {/* Application */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <span className="text-white text-lg font-bold">{serviceName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm leading-tight">{serviceName}</span>
                <span className="text-blue-100 text-xs">Application</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="hidden md:flex w-36 h-9 bg-blue-500/20 backdrop-blur-sm border-blue-400/30 text-white hover:bg-blue-500/30 focus:ring-blue-300">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <div className="flex items-center gap-1.5">
                  {languages.find(l => l.value === selectedLanguage)?.flag}
                  <SelectValue placeholder="Language" />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-80 bg-white">
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span>{lang.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}

          {/* Unified Search Bar + Dropdown (no separate filter button) */}
          {/* <div className="relative hidden md:flex items-center gap-2">
            <Popover
              open={isSearchDropdownOpen}
              onOpenChange={(open) => {
                setIsSearchDropdownOpen(open)
              }}
            >
              <PopoverTrigger asChild>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                  <Input
                    type="text"
                    placeholder="Search filters..."
                    value={searchQuery}
                    ref={searchInputRef}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    onClick={() => setIsSearchDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setIsSearchDropdownOpen(true)
                    }}
                    className="pl-10 pr-8 py-2.5 text-sm bg-transparent border-white text-white placeholder:text-blue-200 [&::placeholder]:opacity-100 focus:bg-white/10 focus:border-white h-10 rounded-lg shadow-sm backdrop-blur-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setIsSearchDropdownOpen(false)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-white/70"
                    >
                      ×
                    </button>
                  )}
                </div>
              </PopoverTrigger>
              
            </Popover>
            <kbd className="hidden lg:flex pointer-events-none h-6 select-none items-center gap-1 rounded border border-white bg-white/10 px-2 font-mono text-[10px] font-medium text-white opacity-100">
              <span className="text-xs">Ctrl</span>K
            </kbd>
          </div> */}

          {/* Notification Bell */}
          {/* <Button variant="ghost" size="icon" className="relative text-blue-100 hover:text-white hover:bg-blue-600/30 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full border-2 border-blue-700" />
          </Button> */}

          {/* Combined user avatar + menu */}
          <div className="relative flex items-center gap-2" ref={menuRef}>
            <button
              type="button"
              onClick={handleProfile}
              className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full bg-white/10 hover:bg-white/20 text-blue-50 border border-white/30 shadow-sm transition-colors"
              aria-label="Open profile"
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center ring-2 ring-blue-400/50">
                <span className="text-blue-600 font-bold text-sm">{firstLetter}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="grid h-8 w-8 place-items-center text-blue-50 transition-colors hover:text-white"
              aria-label="Open user menu"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-xl z-[150]">
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-900 transition-colors hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 text-gray-900" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </header>

      {/* Navigation Bar - render top-level menu from navItemsForm - Sticky separately */}
      <nav className="sticky top-0 z-50 w-full flex items-center gap-0 px-6 py-0 bg-gradient-to-r from-blue-50 to-white border-b border-blue-200 overflow-x-auto scroll-hidden scroll-smooth shadow-sm" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {navItems.map((nav: any) => (
          <div key={nav.label} className="relative flex-shrink-0">
            <Link
              href={nav?.link ? `${nav.link}` : "#"}
              className="text-sm font-normal transition-colors whitespace-nowrap py-2 border-b-2 text-gray-900 hover:text-blue-600 hover:border-blue-500 border-transparent flex-shrink-0 rounded-none px-2 inline-flex items-center gap-1"
            >
              {nav.label}
            </Link>
          </div>
        ))}
      </nav>

      {selectedProfileType === "company" ? (
        <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} userName={userName} />
      ) : selectedProfileType === "contract" ? (
        <ContractProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} userName={userName} />
      ) : (
        <ContractorProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} userName={userName} />
      )}
    </>
  )
}
