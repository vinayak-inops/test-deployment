export default function useCurrentDomain(): string | null {
  const isReverseProxy: boolean =
    process.env.NEXT_PUBLIC_REVERSEPROXY === "true"

  if (isReverseProxy && typeof window !== "undefined") {
    return window.location.origin
  }

  const envOrigins = process.env.NEXT_PUBLIC_NEXTAUTH_URL || ""
  if (!envOrigins) return null

  const origins = envOrigins.split(",").map((o) => o.trim()).filter(Boolean)
  return origins.length > 0 ? origins[0] : null
}
