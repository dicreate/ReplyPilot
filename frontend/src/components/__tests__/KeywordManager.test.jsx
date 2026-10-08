import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import KeywordManager from '../KeywordManager'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// Mock localStorage
const mockToken = 'fake-jwt-token'

describe('KeywordManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem.mockReturnValue(mockToken)
    
    // Default mock responses
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/keywords/placeholders')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              '{followername}': 'The username of the person who commented',
              '{keyword}': 'The keyword that was matched'
            }
          }
        })
      }
      if (url.includes('/keywords')) {
        return Promise.resolve({
          data: {
            success: true,
            data: []
          }
        })
      }
      return Promise.reject(new Error('Unexpected URL'))
    })
  })

  it('renders keyword manager correctly', async () => {
    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Keyword Management')).toBeInTheDocument()
      expect(screen.getByLabelText('Keyword')).toBeInTheDocument()
      expect(screen.getByLabelText(/Response Message/)).toBeInTheDocument()
      expect(screen.getByText('Add Keyword')).toBeInTheDocument()
    })
  })

  it('loads existing keywords on mount', async () => {
    const mockKeywords = [
      {
        _id: '1',
        keyword: 'hello',
        message: 'Hi there!',
        matchCount: 5,
        createdAt: '2023-01-01T00:00:00Z'
      }
    ]

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/keywords/placeholders')) {
        return Promise.resolve({
          data: { success: true, data: {} }
        })
      }
      if (url.includes('/keywords')) {
        return Promise.resolve({
          data: { success: true, data: mockKeywords }
        })
      }
    })

    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByText('hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
      expect(screen.getByText('(5 matches)')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<KeywordManager />)
    
    expect(screen.getByText('Loading keywords...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'))
    
    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load keywords')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })

  it('adds new keyword successfully', async () => {
    const user = userEvent.setup()
    
    mockedAxios.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          _id: '2',
          keyword: 'thanks',
          message: 'You\'re welcome!'
        }
      }
    })

    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByLabelText('Keyword')).toBeInTheDocument()
    })

    // Fill form
    await user.type(screen.getByLabelText('Keyword'), 'thanks')
    await user.type(screen.getByLabelText(/Response Message/), 'You\'re welcome!')
    
    // Submit form
    await user.click(screen.getByText('Add Keyword'))
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/keywords',
        { keyword: 'thanks', message: 'You\'re welcome!' },
        { headers: { Authorization: `Bearer ${mockToken}` } }
      )
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Add Keyword')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Keyword')
    expect(addButton).toBeDisabled()
    
    // Add only keyword
    await user.type(screen.getByLabelText('Keyword'), 'test')
    expect(addButton).toBeDisabled()
    
    // Add message
    await user.type(screen.getByLabelText(/Response Message/), 'Test message')
    expect(addButton).not.toBeDisabled()
  })

  it('shows placeholders when requested', async () => {
    const user = userEvent.setup()
    
    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Show Placeholders')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Show Placeholders'))
    
    await waitFor(() => {
      expect(screen.getByText('{followername}')).toBeInTheDocument()
      expect(screen.getByText('{keyword}')).toBeInTheDocument()
      expect(screen.getByText('Hide Placeholders')).toBeInTheDocument()
    })
  })

  it('adds placeholder to message when clicked', async () => {
    const user = userEvent.setup()
    
    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Show Placeholders')).toBeInTheDocument()
    })

    // Show placeholders
    await user.click(screen.getByText('Show Placeholders'))
    
    await waitFor(() => {
      expect(screen.getByText('{followername}')).toBeInTheDocument()
    })

    // Click placeholder
    await user.click(screen.getByText('{followername}'))
    
    const messageInput = screen.getByLabelText(/Response Message/)
    expect(messageInput.value).toBe('{followername}')
  })

  it('shows message preview', async () => {
    const user = userEvent.setup()
    
    mockedAxios.post.mockImplementation((url) => {
      if (url.includes('/preview')) {
        return Promise.resolve({
          data: {
            success: true,
            data: { preview: 'Hello john_doe!' }
          }
        })
      }
    })

    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Response Message/)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/Response Message/), 'Hello {followername}!')
    
    await waitFor(() => {
      expect(screen.getByText('Preview:')).toBeInTheDocument()
      expect(screen.getByText('Hello john_doe!')).toBeInTheDocument()
    })
  })

  it('edits existing keyword', async () => {
    const user = userEvent.setup()
    
    const mockKeywords = [
      {
        _id: '1',
        keyword: 'hello',
        message: 'Hi there!',
        matchCount: 5,
        createdAt: '2023-01-01T00:00:00Z'
      }
    ]

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/keywords/placeholders')) {
        return Promise.resolve({ data: { success: true, data: {} } })
      }
      if (url.includes('/keywords')) {
        return Promise.resolve({ data: { success: true, data: mockKeywords } })
      }
    })

    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Edit'))
    
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hi there!')).toBeInTheDocument()
    expect(screen.getByText('Update Keyword')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('deletes keyword with confirmation', async () => {
    const user = userEvent.setup()
    
    // Mock window.confirm
    window.confirm = vi.fn().mockReturnValue(true)
    
    const mockKeywords = [
      {
        _id: '1',
        keyword: 'hello',
        message: 'Hi there!',
        matchCount: 5,
        createdAt: '2023-01-01T00:00:00Z'
      }
    ]

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/keywords')) {
        return Promise.resolve({ data: { success: true, data: mockKeywords } })
      }
      return Promise.resolve({ data: { success: true, data: {} } })
    })

    mockedAxios.delete.mockResolvedValue({
      data: { success: true }
    })

    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Delete'))
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this keyword?')
    
    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:5000/api/keywords/1',
        { headers: { Authorization: `Bearer ${mockToken}` } }
      )
    })
  })

  it('shows empty state when no keywords exist', async () => {
    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByText('No keywords added yet. Add your first keyword above!')).toBeInTheDocument()
    })
  })

  it('handles form submission errors', async () => {
    const user = userEvent.setup()
    
    mockedAxios.post.mockRejectedValue({
      response: {
        data: { message: 'Keyword already exists' }
      }
    })

    render(<KeywordManager />)
    
    await waitFor(() => {
      expect(screen.getByLabelText('Keyword')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Keyword'), 'duplicate')
    await user.type(screen.getByLabelText(/Response Message/), 'Test message')
    await user.click(screen.getByText('Add Keyword'))
    
    await waitFor(() => {
      expect(screen.getByText('Keyword already exists')).toBeInTheDocument()
    })
  })
})