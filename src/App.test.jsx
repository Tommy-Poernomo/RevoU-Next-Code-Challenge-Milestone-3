import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  
  it('renders todo app title', () => {
    render(<App />)
    expect(screen.getByText('My Todo List')).toBeInTheDocument()
  })
  
  it('can add a new todo', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('What needs to be done?')
    const addButton = screen.getByText('Add')
    
    fireEvent.change(input, { target: { value: 'Test todo' } })
    fireEvent.click(addButton)
    
    expect(screen.getByText('Test todo')).toBeInTheDocument()
  })
  
  it('can toggle todo completion', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('What needs to be done?')
    const addButton = screen.getByText('Add')
    
    fireEvent.change(input, { target: { value: 'Test todo' } })
    fireEvent.click(addButton)
    
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    
    expect(checkbox).toBeChecked()
  })
  
  it('can delete a todo', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('What needs to be done?')
    const addButton = screen.getByText('Add')
    
    fireEvent.change(input, { target: { value: 'Test todo' } })
    fireEvent.click(addButton)
    
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    
    expect(screen.queryByText('Test todo')).not.toBeInTheDocument()
  })
  
  it('shows correct stats', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('What needs to be done?')
    const addButton = screen.getByText('Add')
    
    fireEvent.change(input, { target: { value: 'Todo 1' } })
    fireEvent.click(addButton)
    
    fireEvent.change(input, { target: { value: 'Todo 2' } })
    fireEvent.click(addButton)
    
    expect(screen.getByText(/Total: 2/)).toBeInTheDocument()
    expect(screen.getByText(/Active: 2/)).toBeInTheDocument()
  })
})
