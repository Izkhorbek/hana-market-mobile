# SKILL: Authentication System (React Native + .NET 8 + JWT + Phone)

---

## 🎯 Purpose

Build a secure, scalable authentication system using:

* Phone number login
* JWT authentication
* Secure storage
* Token lifecycle management

---

## 📦 OUTPUT

* Login screen (phone input)
* OTP verification (optional / future-ready)
* Auth state management
* Token storage & refresh logic
* Protected API access

---

# 🧱 AUTH ARCHITECTURE

Frontend:

UI (LoginScreen)
↓
Auth Hooks (useAuth)
↓
Auth Store (Zustand)
↓
Auth Service (API)
↓
Backend (.NET Auth Controller)

---

# 🔐 AUTH FLOW (CURRENT SYSTEM)

## Step 1: User enters phone

POST `/auth/login`

✔ Request:

```json
{
  "phone_number": "+998901234567"
}
```

---

## Step 2: Backend response

IMPORTANT:

JWT is returned in HEADER:

* X-Access-Token
* X-Expires-At

✔ Source: API docs 

---

## Step 3: Store token securely

NEVER use AsyncStorage

✔ Use:

* Expo SecureStore

---

## Step 4: Save user data

```ts
{
  id,
  username,
  phone_number,
  profile_image_url
}
```

---

## Step 5: Global auth state

User is now authenticated

---

# 🧠 AUTH STATE (ZUSTAND)

## Store Structure

```ts
type AuthStore = {
  user: User | null
  token: string | null
  expiresAt: string | null

  login(user, token, expiresAt)
  logout()
  isAuthenticated(): boolean
}
```

---

## Rules

* Token in memory + secure storage
* Always sync on app start

---

# 🔁 TOKEN LIFECYCLE

## On App Start

```ts
1. Load token from SecureStore
2. Check expiresAt
3. If valid → restore session
4. If expired → logout
```

---

## Token Expiration Handling

IF 401 response:

* Clear auth
* Redirect to login

---

## (Advanced - Future)

Add refresh token system

---

# 📡 API SERVICE (IMPORTANT)

## Axios / Fetch Interceptor

Attach token automatically:

```ts
headers: {
  Authorization: `Bearer ${token}`
}
```

---

## Handle Errors

* 401 → logout
* 403 → blocked user screen

---

# 📱 LOGIN UI LOGIC

## Steps

1. Input phone number
2. Validate format
3. Call login API
4. Extract token from headers
5. Save auth state
6. Navigate to Home

---

# 📲 PHONE VALIDATION RULES

* Must start with +998
* Length check
* Prevent duplicates

---

# 🔐 SECURITY RULES

* Use HTTPS only
* Store token securely
* Do NOT log tokens
* Validate all inputs

---

# 🚫 COMMON MISTAKES (AVOID)

❌ Storing token in AsyncStorage
❌ Not handling expiration
❌ Not attaching token to requests
❌ Ignoring 401 errors

---

# 🧩 HOOK DESIGN

## useAuth()

```ts
login(phone)
logout()
getCurrentUser()
```

---

## useRequireAuth()

* Redirect if not logged in

---

# 🔀 DECISION LOGIC

IF token exists AND valid → allow access
IF token expired → logout
IF blocked → show blocked screen

---

# 🧪 TESTING CHECKLIST

* Valid login
* Invalid phone
* Expired token
* Unauthorized access
* App restart session restore

---

# ✅ QUALITY CRITERIA

* No token leaks
* Instant login
* Smooth UX
* Secure storage

---

# 🚀 EXAMPLE PROMPTS

* "Build login screen with phone auth"
* "Create auth Zustand store"
* "Implement API interceptor with JWT"

---

# 🔥 NEXT IMPROVEMENTS

* OTP verification (SMS)
* Refresh tokens
* Social login
* Device binding
