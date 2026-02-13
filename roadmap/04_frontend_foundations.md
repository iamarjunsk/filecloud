# Phase 4: Frontend Foundation

**Goal**: Initialize the Vue 3 web application with routing, state management, and authentication UI.

## Deliverables

- [ ] Vue 3 Project Setup (Vite)
- [ ] Tailwind CSS & UI Components
- [ ] Authentication Screens (Login, Register)
- [ ] Application Layout (Sidebar, Navbar)

## Technical Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **State**: Pinia
- **Router**: Vue Router
- **Styling**: Tailwind CSS + (Optional: Headless UI or PrimeVue)
- **Icons**: Heroicons or Phosphor Icons

## Tasks

### 4.1 Project Setup

- `npm create vite@latest frontend -- --template vue-ts`.
- Install `pinia`, `vue-router`, `axios` (or `@vueuse/core`).
- Configure Tailwind CSS.
- Setup `src/api/client.ts` with Axios interceptors for JWT injection and Refresh Token logic.

### 4.2 State Management (Auth Store)

- Create `stores/auth.ts`:
    - Actions: `login`, `register`, `logout`, `fetchProfile`.
    - State: `user`, `token`, `isAuthenticated`.
    - Persistence: Save/Load token from `localStorage`.

### 4.3 Routing & Layouts

- **Layouts**:
    - `AuthLayout.vue`: Center card for login/register.
    - `DashboardLayout.vue`: Sidebar (Nav), Topbar (Search/Profile), Main Content.
- **Routes**:
    - `/login`, `/register` (Public).
    - `/` (Protected, redirects to `/files`).
    - `/files/*` (File Browser).
    - `/shared`, `/trash`, `/settings`.

### 4.4 Auth UI Implementation

- **Login Page**: Email/Password form, Error handling, Redirect to dashboard.
- **Register Page**: Name/Email/Password.
- **Route Guards**: `router.beforeEach` to check auth state.
