---
name: state-management-data-fetching
description: "Manage application state with Zustand and server state with TanStack Query. Covers store design, selectors, mutations, caching, and integration patterns."
origin: codex-project-template
---

# State Management + Data Fetching Skill (Zustand + TanStack Query)

Comprehensive guide for managing **application state** (Zustand) and **server state** (TanStack Query) in React projects.

## When to Use

Invoke this skill:
- When designing a new store or state slice
- When fetching data from an API
- When managing mutations (POST, PUT, DELETE)
- When handling loading/error states
- When optimizing cache and refetch behavior
- When integrating Zustand stores with TanStack Query

## Architecture Overview

### State Types

| Type | Tool | Purpose | Example |
|------|------|---------|---------|
| **App State** | Zustand | UI state, user preferences, filters | theme, sidebar open/closed, form values |
| **Server State** | TanStack Query | API data, cache, sync | users list, post details, comments |
| **Derived State** | Selectors | Computed values from stores | filtered users, total count |

### Data Flow
```
User Action
    ↓
Zustand Store (app state)
    ↓
TanStack Query (fetch/mutate)
    ↓
API Server
    ↓
TanStack Query (cache)
    ↓
Component (re-render)
```

## Zustand: Application State

### Setup

**Installation:**
```bash
npm install zustand
```

**Create a store:**
```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIState {
  // State
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notifications: Notification[]

  // Actions
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        sidebarOpen: true,
        theme: 'light',
        notifications: [],

        // Actions
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setTheme: (theme) => set({ theme }),

        addNotification: (notification) =>
          set((state) => ({
            notifications: [...state.notifications, notification],
          })),

        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),
      }),
      {
        name: 'ui-store', // localStorage key
      }
    ),
    { name: 'UIStore' }
  )
)
```

### Pattern 1: Simple Store

**Basic counter store:**
```typescript
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

**Usage in component:**
```typescript
function Counter() {
  const { count, increment, decrement } = useCounterStore()

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}
```

### Pattern 2: Selectors (Optimize Re-renders)

**Without selectors (re-renders on any state change):**
```typescript
function UserProfile() {
  const state = useUserStore() // Re-renders if ANY field changes
  return <div>{state.user.name}</div>
}
```

**With selectors (re-renders only when selected value changes):**
```typescript
function UserProfile() {
  const userName = useUserStore((state) => state.user.name)
  return <div>{userName}</div>
}
```

**Create reusable selectors:**
```typescript
interface UserState {
  user: { id: string; name: string; email: string }
  isLoading: boolean
  setUser: (user: UserState['user']) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: { id: '', name: '', email: '' },
  isLoading: false,
  setUser: (user) => set({ user }),
}))

// Selectors
export const selectUserName = (state: UserState) => state.user.name
export const selectUserEmail = (state: UserState) => state.user.email
export const selectIsLoading = (state: UserState) => state.isLoading

// Usage
function UserProfile() {
  const name = useUserStore(selectUserName)
  const email = useUserStore(selectUserEmail)
  return (
    <div>
      <p>{name}</p>
      <p>{email}</p>
    </div>
  )
}
```

### Pattern 3: Computed/Derived State

**Selectors with computation:**
```typescript
interface CartState {
  items: CartItem[]
  getTotalPrice: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  getTotalPrice: () => {
    const items = get().items
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  getItemCount: () => {
    const items = get().items
    return items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))

// Usage
function CartSummary() {
  const totalPrice = useCartStore((state) => state.getTotalPrice())
  const itemCount = useCartStore((state) => state.getItemCount())

  return (
    <div>
      <p>Items: {itemCount}</p>
      <p>Total: ${totalPrice}</p>
    </div>
  )
}
```

### Pattern 4: Async Actions

**Async operations in Zustand:**
```typescript
interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  fetchUser: (id: string) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  fetchUser: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/users/${id}`)
      const user = await response.json()
      set({ user, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
```

### Pattern 5: Multiple Stores

**Separate concerns into multiple stores:**
```typescript
// Store 1: UI state
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))

// Store 2: Auth state
export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))

// Store 3: Filters
export const useFilterStore = create((set) => ({
  category: 'all',
  sortBy: 'name',
  setCategory: (category) => set({ category }),
  setSortBy: (sortBy) => set({ sortBy }),
}))

// Usage
function App() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const category = useFilterStore((state) => state.category)

  return (
    <div>
      {sidebarOpen && <Sidebar />}
      {isAuthenticated && <Dashboard category={category} />}
    </div>
  )
}
```

## TanStack Query: Server State

### Setup

**Installation:**
```bash
npm install @tanstack/react-query
```

**Setup QueryClient:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  )
}
```

### Pattern 1: Basic Query

**Fetch data:**
```typescript
import { useQuery } from '@tanstack/react-query'

function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users')
      return response.json()
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### Pattern 2: Query with Parameters

**Dynamic queries:**
```typescript
function UserDetail({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['users', userId], // Include userId in key
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`)
      return response.json()
    },
    enabled: !!userId, // Only run if userId exists
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>

  return <div>{user?.name}</div>
}
```

### Pattern 3: Mutations

**Create, update, delete:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreateUserForm() {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (newUser: NewUser) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  )
}
```

### Pattern 4: Optimistic Updates

**Update UI before server confirms:**
```typescript
function TodoItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient()

  const { mutate } = useMutation({
    mutationFn: async (completed: boolean) => {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
      return response.json()
    },
    onMutate: async (completed) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot previous data
      const previousTodos = queryClient.getQueryData(['todos'])

      // Update UI optimistically
      queryClient.setQueryData(['todos'], (old: Todo[]) =>
        old.map((t) => (t.id === todo.id ? { ...t, completed } : t))
      )

      return { previousTodos }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => mutate(e.target.checked)}
      />
      {todo.title}
    </div>
  )
}
```

### Pattern 5: Infinite Queries (Pagination)

**Load more pattern:**
```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

function InfiniteUserList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['users'],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await fetch(`/api/users?page=${pageParam}`)
        return response.json()
      },
      getNextPageParam: (lastPage, pages) =>
        lastPage.hasMore ? pages.length + 1 : undefined,
    })

  return (
    <div>
      {data?.pages.map((page) =>
        page.users.map((user) => <div key={user.id}>{user.name}</div>)
      )}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  )
}
```

## Integration: Zustand + TanStack Query

### Pattern 1: Store Triggers Query

**Use Zustand to control what TanStack Query fetches:**
```typescript
// Store: manages filter state
interface FilterState {
  category: string
  sortBy: string
  setCategory: (category: string) => void
  setSortBy: (sortBy: string) => void
}

export const useFilterStore = create<FilterState>((set) => ({
  category: 'all',
  sortBy: 'name',
  setCategory: (category) => set({ category }),
  setSortBy: (sortBy) => set({ sortBy }),
}))

// Component: uses both stores
function ProductList() {
  const category = useFilterStore((state) => state.category)
  const sortBy = useFilterStore((state) => state.sortBy)

  const { data: products } = useQuery({
    queryKey: ['products', category, sortBy], // Re-fetch when filters change
    queryFn: async () => {
      const response = await fetch(
        `/api/products?category=${category}&sort=${sortBy}`
      )
      return response.json()
    },
  })

  return (
    <div>
      <FilterControls />
      <ProductGrid products={products} />
    </div>
  )
}
```

### Pattern 2: Query Results in Store

**Sync TanStack Query data into Zustand:**
```typescript
interface UserState {
  selectedUser: User | null
  setSelectedUser: (user: User) => void
}

export const useUserStore = create<UserState>((set) => ({
  selectedUser: null,
  setSelectedUser: (user) => set({ selectedUser: user }),
}))

function UserSelector() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users')
      return response.json()
    },
  })

  const setSelectedUser = useUserStore((state) => state.setSelectedUser)

  return (
    <select onChange={(e) => {
      const user = users?.find((u) => u.id === e.target.value)
      if (user) setSelectedUser(user)
    }}>
      {users?.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  )
}
```

### Pattern 3: Mutation with Store Update

**Update both server and local state:**
```typescript
function UpdateUserForm({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const setSelectedUser = useUserStore((state) => state.setSelectedUser)

  const { mutate } = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      return response.json()
    },
    onSuccess: (updatedUser) => {
      // Update TanStack Query cache
      queryClient.setQueryData(['users', userId], updatedUser)

      // Update Zustand store
      setSelectedUser(updatedUser)
    },
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      mutate({ name: formData.get('name') as string })
    }}>
      <input name="name" required />
      <button type="submit">Update</button>
    </form>
  )
}
```

## Common Patterns & Anti-Patterns

### ✅ DO: Use selectors to prevent unnecessary re-renders
```typescript
const name = useUserStore((state) => state.user.name)
```

### ❌ DON'T: Destructure entire store
```typescript
const { user, isLoading } = useUserStore() // Re-renders on any change
```

### ✅ DO: Invalidate queries after mutations
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['users'] })
}
```

### ❌ DON'T: Manually update cache without invalidation
```typescript
// Risky — cache may become stale
queryClient.setQueryData(['users'], newData)
```

### ✅ DO: Use query keys consistently
```typescript
const queryKey = ['users', userId, 'posts']
```

### ❌ DON'T: Use random/dynamic query keys
```typescript
const queryKey = ['data', Math.random()] // Creates new cache entry each time
```

### ✅ DO: Enable queries conditionally
```typescript
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
  enabled: !!userId, // Only fetch if userId exists
})
```

### ❌ DON'T: Fetch without checking dependencies
```typescript
const { data } = useQuery({
  queryKey: ['user'],
  queryFn: () => fetchUser(userId), // userId might be undefined
})
```

## Checklist

- [ ] Zustand stores are organized by concern (UI, Auth, Filters, etc.)
- [ ] Selectors are used to prevent unnecessary re-renders
- [ ] TanStack Query keys are consistent and hierarchical
- [ ] Mutations invalidate relevant queries
- [ ] Error states are handled in UI
- [ ] Loading states are shown to user
- [ ] Optimistic updates are used where appropriate
- [ ] Cache times are configured appropriately
- [ ] No duplicate data between Zustand and TanStack Query
- [ ] Async operations use proper error handling

## Resources

- [Zustand Docs](https://github.com/pmndrs/zustand)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [State Management Best Practices](https://kentcdodds.com/blog/application-state-management-with-react-hooks)
