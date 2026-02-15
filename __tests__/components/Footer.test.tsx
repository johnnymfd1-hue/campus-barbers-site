import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '@/components/Footer'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

describe('Footer', () => {
  it('renders the brand name', () => {
    render(<Footer />)
    expect(screen.getByText('Campus Barbers')).toBeInTheDocument()
  })

  it('displays Est. 1952', () => {
    render(<Footer />)
    expect(screen.getByText('Est. 1952')).toBeInTheDocument()
  })

  it('renders the phone number', () => {
    render(<Footer />)
    expect(screen.getByText('(517) 337-9881')).toBeInTheDocument()
  })

  it('renders the address', () => {
    render(<Footer />)
    expect(screen.getByText('621 E Grand River Ave')).toBeInTheDocument()
    expect(screen.getByText('East Lansing, MI 48823')).toBeInTheDocument()
  })

  it('renders quick links', () => {
    render(<Footer />)
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('Our Barbers')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
  })

  it('renders Staff Login and Admin links', () => {
    render(<Footer />)
    const staffLink = screen.getByText('Staff Login')
    const adminLink = screen.getByText('Admin')
    expect(staffLink).toBeInTheDocument()
    expect(staffLink.closest('a')).toHaveAttribute('href', '/staff')
    expect(adminLink).toBeInTheDocument()
    expect(adminLink.closest('a')).toHaveAttribute('href', '/admin')
  })

  it('shows current year copyright', () => {
    render(<Footer />)
    const year = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`${year}`))).toBeInTheDocument()
  })
})
