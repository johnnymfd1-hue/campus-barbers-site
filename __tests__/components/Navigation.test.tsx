import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from '@/components/Navigation'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileInView, viewport, ...htmlProps } = props
      return <div {...htmlProps}>{children}</div>
    },
    nav: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...htmlProps } = props
      return <nav {...htmlProps}>{children}</nav>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

describe('Navigation', () => {
  const mockOnBookClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the brand name', () => {
    render(<Navigation onBookClick={mockOnBookClick} />)
    expect(screen.getByText('Campus Barbers')).toBeInTheDocument()
  })

  it('renders nav links', () => {
    render(<Navigation onBookClick={mockOnBookClick} />)
    expect(screen.getAllByText('Services').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Barbers').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Location').length).toBeGreaterThanOrEqual(1)
  })

  it('renders Book Now button', () => {
    render(<Navigation onBookClick={mockOnBookClick} />)
    expect(screen.getByText('Book Now')).toBeInTheDocument()
  })

  it('calls onBookClick when Book Now is clicked', () => {
    render(<Navigation onBookClick={mockOnBookClick} />)
    fireEvent.click(screen.getByText('Book Now'))
    expect(mockOnBookClick).toHaveBeenCalledTimes(1)
  })

  it('renders mobile menu toggle button', () => {
    render(<Navigation onBookClick={mockOnBookClick} />)
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument()
  })

  it('shows mobile menu when toggle is clicked', () => {
    render(<Navigation onBookClick={mockOnBookClick} />)
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    expect(screen.getByText('Book Appointment')).toBeInTheDocument()
  })

  it('closes mobile menu and calls onBookClick when mobile Book Appointment is clicked', () => {
    render(<Navigation onBookClick={mockOnBookClick} />)
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    fireEvent.click(screen.getByText('Book Appointment'))
    expect(mockOnBookClick).toHaveBeenCalledTimes(1)
  })
})
