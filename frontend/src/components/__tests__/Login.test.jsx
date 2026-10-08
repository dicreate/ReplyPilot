import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Login from '../Login'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  )
}

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.location.href = ''
  })

  it('renders login form correctly', () => {
    renderLogin()
    
    expect(screen.getByText('Instagram Auto-Reply Tool')).toBeInTheDocument()
    expect(screen.getByText('Login with Instagram')).toBeInTheDocument()
    expect(screen.getByText(/Automate your Instagram engagement/)).toBeInTheDocument()
  })

  it('redirects to dashboard if user is already logged in', () => {
    localStorage.getItem.mockReturnValue('fake-token')
    
    renderLogin()
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('handles login button click', async () => {
    renderLogin()
    
    const loginButton = screen.getByText('Login with Instagram')
    fireEvent.click(loginButton)
    
    await waitFor(() => {
      expect(window.location.href).toContain('api.instagram.com/oauth/authorize')
      expect(window.location.href).toContain('client_id=test-client-id')
      expect(window.location.href).toContain('redirect_uri=http://localhost:3000/callback')
    })
  })

  it('shows loading state when login is in progress', async () => {
    renderLogin()
    
    const loginButton = screen.getByText('Login with Instagram')
    fireEvent.click(loginButton)
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('disables button during loading', async () => {
    renderLogin()
    
    const loginButton = screen.getByText('Login with Instagram')
    fireEvent.click(loginButton)
    
    expect(loginButton).toBeDisabled()
  })

  it('handles login errors gracefully', async () => {
    // Mock window.location.href setter to throw error
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        set href(url) {
          throw new Error('Navigation failed')
        }
      },
      writable: true
    })

    // Mock alert
    window.alert = vi.fn()

    renderLogin()
    
    const loginButton = screen.getByText('Login with Instagram')
    fireEvent.click(loginButton)
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Login failed. Please try again.')
    })
  })

  it('constructs correct OAuth URL', async () => {
    renderLogin()
    
    const loginButton = screen.getByText('Login with Instagram')
    fireEvent.click(loginButton)
    
    await waitFor(() => {
      const expectedParams = [
        'client_id=test-client-id',
        'redirect_uri=http://localhost:3000/callback',
        'scope=user_profile,user_media',
        'response_type=code'
      ]
      
      expectedParams.forEach(param => {
        expect(window.location.href).toContain(param)
      })
    })
  })

  it('has proper accessibility attributes', () => {
    renderLogin()
    
    const loginButton = screen.getByRole('button', { name: /login with instagram/i })
    expect(loginButton).toBeInTheDocument()
    
    const loadingSpinner = screen.queryByRole('status')
    if (loadingSpinner) {
      expect(loadingSpinner).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('displays proper card layout', () => {
    renderLogin()
    
    expect(screen.getByText('Instagram Auto-Reply Tool')).toBeInTheDocument()
    expect(screen.getByText(/Automate your Instagram engagement/)).toBeInTheDocument()
    
    const container = screen.getByText('Instagram Auto-Reply Tool').closest('.card')
    expect(container).toBeInTheDocument()
  })
})