import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgreementGate from '@/components/AgreementGate'

// Mock firebase/firestore
const mockSetDoc = vi.fn()
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}))

// Mock firebase client
vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...htmlProps } = props
      return <div {...htmlProps}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const defaultProps = {
  userEmail: 'staff@campusbarbers.com',
  userId: 'user-123',
  onAccepted: vi.fn(),
}

describe('AgreementGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetDoc.mockResolvedValue(undefined)
  })

  // ------- RENDERING -------
  describe('rendering', () => {
    it('renders the agreement title', () => {
      render(<AgreementGate {...defaultProps} />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent(/Non-Solicitation/)
      expect(heading).toHaveTextContent(/Confidentiality Agreement/)
    })

    it('displays the user email', () => {
      render(<AgreementGate {...defaultProps} />)
      expect(screen.getByText('staff@campusbarbers.com')).toBeInTheDocument()
    })

    it('shows scroll instruction', () => {
      render(<AgreementGate {...defaultProps} />)
      expect(screen.getByText(/Scroll to bottom to continue/)).toBeInTheDocument()
    })

    it('renders the agreement version', () => {
      render(<AgreementGate {...defaultProps} />)
      expect(screen.getByText(/2025-02-09-v1/)).toBeInTheDocument()
    })
  })

  // ------- SCROLL REQUIREMENT -------
  describe('scroll requirement', () => {
    it('disables signature input until scrolled to bottom', () => {
      render(<AgreementGate {...defaultProps} />)
      const nameInput = screen.getByPlaceholderText('First and Last Name')
      expect(nameInput).toBeDisabled()
    })

    it('disables checkbox until scrolled to bottom', () => {
      render(<AgreementGate {...defaultProps} />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeDisabled()
    })

    it('disables submit button until scrolled to bottom', () => {
      render(<AgreementGate {...defaultProps} />)
      const button = screen.getByRole('button', { name: /Accept/i })
      expect(button).toBeDisabled()
    })
  })

  // ------- VALIDATION -------
  describe('validation', () => {
    function simulateScrollToBottom() {
      const scrollContainers = document.querySelectorAll('div')
      for (const el of scrollContainers) {
        if (el.className.includes('overflow-y-auto')) {
          Object.defineProperty(el, 'scrollHeight', { value: 1000, configurable: true })
          Object.defineProperty(el, 'scrollTop', { value: 960, configurable: true })
          Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true })
          fireEvent.scroll(el)
          break
        }
      }
    }

    it('requires full name with first and last name to submit', async () => {
      render(<AgreementGate {...defaultProps} />)
      simulateScrollToBottom()

      await waitFor(() => {
        expect(screen.getByPlaceholderText('First and Last Name')).not.toBeDisabled()
      })

      // Type a full name, check checkbox, and submit
      const nameInput = screen.getByPlaceholderText('First and Last Name')
      await userEvent.type(nameInput, 'John Doe')

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      // Submit should succeed with full name
      fireEvent.click(screen.getByRole('button', { name: /Accept/i }))
      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalled()
      })

      // Verify the stored name is trimmed
      const callArgs = mockSetDoc.mock.calls[0]
      expect(callArgs[1].fullName).toBe('John Doe')
    })

    it('keeps submit button disabled when checkbox is not checked', async () => {
      render(<AgreementGate {...defaultProps} />)
      simulateScrollToBottom()

      await waitFor(() => {
        expect(screen.getByPlaceholderText('First and Last Name')).not.toBeDisabled()
      })

      const nameInput = screen.getByPlaceholderText('First and Last Name')
      await userEvent.type(nameInput, 'John Doe')

      // Do NOT check the checkbox
      const button = screen.getByRole('button', { name: /Accept/i })
      // Button should remain disabled because acknowledged=false
      expect(button).toBeDisabled()
    })

    it('calls onAccepted after successful submission', async () => {
      render(<AgreementGate {...defaultProps} />)
      simulateScrollToBottom()

      await waitFor(() => {
        expect(screen.getByPlaceholderText('First and Last Name')).not.toBeDisabled()
      })

      const nameInput = screen.getByPlaceholderText('First and Last Name')
      await userEvent.type(nameInput, 'John Doe')

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      const button = screen.getByRole('button', { name: /Accept/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalled()
        expect(defaultProps.onAccepted).toHaveBeenCalled()
      })
    })

    it('stores correct agreement data in Firestore', async () => {
      render(<AgreementGate {...defaultProps} />)
      simulateScrollToBottom()

      await waitFor(() => {
        expect(screen.getByPlaceholderText('First and Last Name')).not.toBeDisabled()
      })

      const nameInput = screen.getByPlaceholderText('First and Last Name')
      await userEvent.type(nameInput, 'John Doe')

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      const button = screen.getByRole('button', { name: /Accept/i })
      fireEvent.click(button)

      await waitFor(() => {
        const callArgs = mockSetDoc.mock.calls[0]
        const data = callArgs[1]
        expect(data.userId).toBe('user-123')
        expect(data.email).toBe('staff@campusbarbers.com')
        expect(data.fullName).toBe('John Doe')
        expect(data.agreementVersion).toBe('2025-02-09-v1')
      })
    })

    it('shows error when Firestore write fails', async () => {
      mockSetDoc.mockRejectedValueOnce(new Error('Write failed'))

      render(<AgreementGate {...defaultProps} />)
      simulateScrollToBottom()

      await waitFor(() => {
        expect(screen.getByPlaceholderText('First and Last Name')).not.toBeDisabled()
      })

      const nameInput = screen.getByPlaceholderText('First and Last Name')
      await userEvent.type(nameInput, 'John Doe')

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      const button = screen.getByRole('button', { name: /Accept/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Failed to save agreement/i)).toBeInTheDocument()
        expect(defaultProps.onAccepted).not.toHaveBeenCalled()
      })
    })
  })
})
