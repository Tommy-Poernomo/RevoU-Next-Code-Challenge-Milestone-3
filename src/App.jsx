import { useState, useEffect, useCallback, useMemo } from 'react' //ditambahkan useCallback untuk perbaikan issue 5, 7, dan juga nantinya 8, ditambah useMemo untuk perbaikan issue 8 dan 9

// Issue 1: Inline API key (security issue)
// Perbaikannya: ==>
// const API_KEY = 'sk-1234567890abcdef' <== dipindah ke file .env dan diakses melalui import.meta.env.VITE_API_KEY
const CLIENT_API_KEY = import.meta.env.VITE_CLIENT_KEY || '';

// Fix Issue 6: Utility untuk generate ID unik (mencegah ID collision)
// Diletakkan di luar komponen agar tidak dibuat ulang di setiap siklus render
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function App() {
  // Issue 2: State management bisa lebih baik
  //const [todos, setTodos] = useState([])
  //const [input, setInput] = useState('')
  //const [filter, setFilter] = useState('all')
  
  // Issue 3: useEffect tanpa dependency array yang tepat
  // useEffect(() => {
  //   // Load from localStorage
  //   const saved = localStorage.getItem('todos')
  //   if (saved) {
  //     setTodos(JSON.parse(saved))
  //   }
  // }, [])
  
  // // Issue 4: useEffect yang terlalu sering run
  // useEffect(() => {
  //   localStorage.setItem('todos', JSON.stringify(todos))
  // })
  
  // Perbaikannya:
  // Fix Issue 2 & 3: Lazy initial state membaca localStorage saat inisialisasi awal
  // Menghilangkan useEffect load di sini dan hanya diletakkan di bagian issue 4 saja, mencegah render flicker dan race condition 
  const [todos, setTodos] = useState(() => {
  try {
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('Failed to load todos from localStorage:', error)
    return []
  }
})

const [input, setInput] = useState('')
const [filter, setFilter] = useState('all')

// Fix Issue 4: Menambahkan dependency array [todos] dengan error handling
// Hanya menyimpan data saat array todos benar-benar berubah, bukan di setiap ketikan/render
useEffect(() => {
  try {
    localStorage.setItem('todos', JSON.stringify(todos))
  } catch (error) {
    console.error('Failed to save todos to localStorage:', error)
  }
}, [todos])

  // // Issue 5: Function yang tidak di-memoize, re-create setiap render
  // const addTodo = () => {
  //   if (input.trim() === '') {
  //     alert('Please enter a todo')
  //     return
  //   }
    
  //   // Issue 6: Menggunakan Date.now() sebagai ID (bisa collision)
  //   const newTodo = {
  //     id: Date.now(),
  //     text: input,
  //     completed: false,
  //     createdAt: new Date().toISOString()
  //   }
    
  //   setTodos([...todos, newTodo])
  //   setInput('')
  // }
  
  // // Issue 7: Tidak ada error handling
  // const deleteTodo = (id) => {
  //   setTodos(todos.filter(todo => todo.id !== id))
  // }
  
  // const toggleTodo = (id) => {
  //   setTodos(todos.map(todo => 
  //     todo.id === id ? { ...todo, completed: !todo.completed } : todo
  //   ))
  // }
  // Perbaikannya:
// Fix Issue 5 & 7: Memoize fungsi dengan useCallback dan gunakan functional update (prev => ...)
const addTodo = useCallback(() => {
  const trimmed = input.trim()
  if (!trimmed) {
    console.warn('Validation: Todo text cannot be empty')
    return
  }

  try {
    const newTodo = {
      /// Fix Issue 6: Menggunakan generator UUID yang aman dari tabrakan ID/ID Collisions
      id: generateId(),
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString()
    }

    setTodos(prevTodos => [...prevTodos, newTodo])
    setInput('')
  } catch (error) {
    console.error('Failed to add todo:', error)
  }
}, [input]) // Hanya dibuat ulang jika nilai `input` berubah

const deleteTodo = useCallback((id) => {
  if (!id) {
    console.warn('Validation: Invalid ID provided for deletion')
    return
  }

  try {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id))
  } catch (error) {
    console.error(`Failed to delete todo with id ${id}:`, error)
  }
}, []) // Tanpa dependensi: stabil dan tidak pernah dibuat ulang

const toggleTodo = useCallback((id) => {
  if (!id) {
    console.warn('Validation: Invalid ID provided for toggle')
    return
  }

  try {
    setTodos(prevTodos => 
      prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  } catch (error) {
    console.error(`Failed to toggle todo with id ${id}:`, error)
  }
}, []) // Tanpa dependensi: stabil dan tidak pernah dibuat ulang
  
  // // Issue 8: Logic filtering yang bisa dipindah ke useMemo
  // const getFilteredTodos = () => {
  //   if (filter === 'active') {
  //     return todos.filter(todo => !todo.completed)
  //   }
  //   if (filter === 'completed') {
  //     return todos.filter(todo => todo.completed)
  //   }
  //   return todos
  // }
  
  // // Issue 9: Calculation yang tidak perlu di setiap render
  // const stats = {
  //   total: todos.length,
  //   completed: todos.filter(t => t.completed).length,
  //   active: todos.filter(t => !t.completed).length
  // }

  // Fix Issue 8: Memoize hasil filter todo dengan useMemo
  // Hanya menghitung ulang jika array `todos` berubah atau opsi `filter` berganti
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed)
      case 'completed':
        return todos.filter(todo => todo.completed)
      default:
        return todos
    }
  }, [todos, filter])

  // Fix Issue 9: Memoize kalkulasi statistik dengan useMemo
  // Menghindari 2x looping filter di setiap render saat user mengetik input
  const stats = useMemo(() => {
    const total = todos.length
    const completed = todos.filter(t => t.completed).length
    const active = total - completed // Optimasi: O(1) kalkulasi tanpa filter kedua

    return { total, active, completed }
  }, [todos])
  
  // Issue 10: Inline event handler dengan arrow function (re-create setiap render)
  return (
    <div className="app">
      <h1>My Todo List</h1>
      
      {/* Issue 11: Tidak ada label untuk accessibility */}
      <div className="input-section">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addTodo()
            }
          }}
          placeholder="What needs to be done?"
        />
        <button onClick={addTodo}>Add</button>
      </div>
      
      {/* Issue 12: Inline styles (inconsistent dengan CSS file) */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setFilter('all')}
          style={{ background: filter === 'all' ? '#28a745' : '#007bff' }}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('active')}
          style={{ background: filter === 'active' ? '#28a745' : '#007bff' }}
        >
          Active
        </button>
        <button 
          onClick={() => setFilter('completed')}
          style={{ background: filter === 'completed' ? '#28a745' : '#007bff' }}
        >
          Completed
        </button>
      </div>
      
      <div className="todo-list">
        {/* Issue 13: Tidak ada handling untuk empty state */}
        {/* {getFilteredTodos().map((todo) => ( diganti dengan ini ==> */}
        {filteredTodos.map(todo => (
          // Issue 14: Key menggunakan index bisa lebih baik dengan ID
          <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input 
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            {/* Issue 15: Potential XSS jika text dari user input */}
            <span dangerouslySetInnerHTML={{ __html: todo.text }} />
            <button 
              className="delete-btn"
              onClick={() => deleteTodo(todo.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      
      <div className="stats">
        <p>Total: {stats.total} | Active: {stats.active} | Completed: {stats.completed}</p>
      </div>
      
      {/* Issue 16: Debug code yang tertinggal */}
      {console.log('Rendering with todos:', todos)}
      {console.log('API Key:', API_KEY)}
    </div>
  )
}

export default App
