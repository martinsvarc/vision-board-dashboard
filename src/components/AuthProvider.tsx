"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface AuthContextType {
  memberId: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ memberId: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [memberId, setMemberId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    const id = searchParams.get('memberId')
    setMemberId(id)
    setLoading(false)
  }, [searchParams])

  return (
    <AuthContext.Provider value={{ memberId, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
