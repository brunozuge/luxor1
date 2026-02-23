"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

interface User {
    id: number
    name: string
    email: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (email: string, password: string) => Promise<boolean>
    logout: () => void
    loading: boolean
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for saved token on mount
        const savedToken = localStorage.getItem("eventpro_token")
        const savedUser = localStorage.getItem("eventpro_user")

        if (savedToken && savedUser) {
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
        }
        setLoading(false)
    }, [])

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (response.ok) {
                setToken(data.token)
                setUser(data.user)
                localStorage.setItem("eventpro_token", data.token)
                localStorage.setItem("eventpro_user", JSON.stringify(data.user))
                toast.success("Login realizado com sucesso!")
                return true
            } else {
                toast.error(data.message || "Credenciais inválidas")
                return false
            }
        } catch (error) {
            console.error("Login error:", error)
            toast.error("Erro ao conectar com o servidor")
            return false
        } finally {
            setLoading(false)
        }
    }, [])

    const logout = useCallback(async () => {
        try {
            if (token) {
                await fetch(`${API_BASE_URL}/logout`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/json",
                    },
                })
            }
        } catch (error) {
            console.error("Logout error:", error)
        } finally {
            setToken(null)
            setUser(null)
            localStorage.removeItem("eventpro_token")
            localStorage.removeItem("eventpro_user")
            toast.success("Você foi desconectado")
        }
    }, [token])

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                loading,
                isAuthenticated: !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
