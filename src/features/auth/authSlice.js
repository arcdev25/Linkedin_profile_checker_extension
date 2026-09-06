import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../app/supabaseClient'
import bcrypt from 'bcryptjs'

// Login
export const loginUser = createAsyncThunk('/auth/login', async ({ email, password }) => {
    // Fetch user by email
    const { data: users, error } = await supabase
        .from('owners')
        .select('*')
        .eq('email', email)
        .single()
    
    if (error || !users) {
        throw new Error('Invalid email or password')
    }

    // Check if user is disabled / pending approval
    if (users.status === 'disabled') {
        throw new Error('Your account is pending admin approval. Please contact the admin.')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, users.password)
    if (!isValidPassword) {
        throw new Error('Invalid email or password')
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = users

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userWithoutPassword))
    localStorage.setItem('token', users.id) // Simple token for now

    return userWithoutPassword
})

// Register (Owner signup)
export const registerUser = createAsyncThunk('/auth/register', async ({ name, email, password }) => {
    // Check if email already exists — use maybeSingle() so no error is thrown when not found
    const { data: existing, error: checkError } = await supabase
        .from('owners')
        .select('email')
        .eq('email', email)
        .maybeSingle()

    // A real DB error (not just "no rows found")
    if (checkError) throw new Error(checkError.message)

    if (existing) {
        throw new Error('Email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new owner — status starts as 'disabled' until admin approves
    const { data, error } = await supabase
        .from('owners')
        .insert([{
            name,
            email,
            password: hashedPassword,
            role: 'owner',
            status: 'disabled'
        }])
        .select()

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) throw new Error('Registration failed — no data returned')

    const { password: _, ...userWithoutPassword } = data[0]
    return userWithoutPassword
})

// Logout
export const logoutUser = createAsyncThunk('/auth/logout', async () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return null
})

// Check auth status
export const checkAuth = createAsyncThunk('/auth/check', async () => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
        throw new Error('Not authenticated')
    }

    const user = JSON.parse(userStr)
    
    // Verify user still exists and is active
    const { data, error } = await supabase
        .from('owners')
        .select('id, name, email, role, status, created_at')
        .eq('id', user.id)
        .single()
    
    if (error || !data) {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        throw new Error('Session expired')
    }

    if (data.status === 'disabled') {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        throw new Error('Your account is pending admin approval. Please contact the admin.')
    }

    // Update localStorage with fresh data
    localStorage.setItem('user', JSON.stringify(data))

    return data
})

export const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
    },
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        setUser: (state, action) => {
            state.user = action.payload
            state.isAuthenticated = !!action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.user = action.payload
                state.isAuthenticated = true
                state.isLoading = false
                state.error = null
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message
                state.isAuthenticated = false
            })
            // Register
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false
                state.error = null
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message
            })
            // Logout
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null
                state.isAuthenticated = false
                state.error = null
            })
            // Check Auth
            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.user = action.payload
                state.isAuthenticated = true
                state.isLoading = false
            })
            .addCase(checkAuth.rejected, (state) => {
                state.user = null
                state.isAuthenticated = false
                state.isLoading = false
            })
    }
})

export const { clearError, setUser } = authSlice.actions
export default authSlice.reducer
