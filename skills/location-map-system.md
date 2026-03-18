# SKILL: Location-Based Feed + Map System (React Native + .NET 8 + Google Maps)

---

## 🎯 Purpose

Build a **location-aware marketplace system**:

* Show nearby products (radius-based)
* Update user location
* Visualize products on Google Map
* Enable hyperlocal discovery

---

## 📦 OUTPUT

* Location permission flow
* GPS tracking system
* Nearby product feed
* Map screen with markers
* Distance-based filtering

---

# 🧱 SYSTEM ARCHITECTURE

Frontend:

UI (FeedScreen / MapScreen)
↓
Hooks (useLocation, useProducts)
↓
State (Zustand / React Query)
↓
Services (API)
↓
Backend (.NET Geo-based filtering)

---

# 📍 1. LOCATION FLOW (CRITICAL)

## Step-by-step

1. Ask permission
2. Get GPS coordinates
3. Send to backend
4. Fetch products nearby

---

## React Native (Expo)

Install:

```bash
expo install expo-location
```

---

## Hook: useLocation()

```ts
1. requestPermissionsAsync()
2. getCurrentPositionAsync()
3. return { latitude, longitude }
```

---

## RULES

* Ask permission only once
* Cache last location
* Fallback if GPS fails

---

# 🌍 2. SAVE USER LOCATION

## API

POST `/user/update/location`

✔ Example:

```json
{
  "latitude": 41.2995,
  "longitude": 69.2401,
  "search_radius_km": 10
}
```

✔ Source: API docs 

---

## Rules

* Update on app start
* Update when user moves significantly (>500m)

---

# 📦 3. LOCATION-BASED PRODUCT FEED

## API

GET `/product/all?user_lat&user_long`

✔ Source: 

---

## Flow

1. Get user location
2. Call API
3. Render list

---

## UI Requirements

* Distance (e.g., "2.5 km")
* Sorting:

  * nearest
  * newest
  * price

---

## React Query Strategy

* Cache by location
* Refetch on change

---

# 🗺️ 4. GOOGLE MAP INTEGRATION

## Library

```bash
expo install react-native-maps
```

---

## Map Screen Flow

1. Load user location
2. Fetch products
3. Render markers

---

## Marker Data

```ts
{
  id,
  latitude,
  longitude,
  title,
  price
}
```

---

## Marker Interaction

* Tap marker → open product detail
* Show preview card

---

# ⚡ PERFORMANCE (VERY IMPORTANT)

## Marker Optimization

* Use clustering (react-native-map-clustering)
* Limit markers per view
* Lazy load products

---

## Region Change Handling

```ts
onRegionChangeComplete(region)
```

→ Fetch products in visible bounds

---

# 📐 5. GEO FILTERING LOGIC (BACKEND)

## Concept

distance = calculate(user, product)

Return only:

distance <= search_radius_km

---

## Sorting

* distance ASC
* created_at DESC

---

# 🔄 6. REAL-TIME LOCATION UPDATE (OPTIONAL)

## Use Case

* Show live nearby items
* Dynamic feed

---

## Strategy

* Poll every X minutes
  OR
* Use SignalR (advanced)

---

# 🧠 STATE DESIGN

## Zustand

```ts
location: {
  latitude
  longitude
  radius
}
```

---

## React Query Keys

```ts
["products", latitude, longitude, filters]
```

---

# 🔀 DECISION LOGIC

IF location not granted → show fallback UI
IF GPS fails → use last saved location
IF map zoom changes → refetch products
IF user moves → update backend

---

# ⚠️ EDGE CASES

* GPS disabled
* No products nearby
* Slow location fetch
* Permission denied

---

# 🛡️ SECURITY

* Validate coordinates
* Prevent spoofing (backend check optional)
* Limit radius

---

# 🧪 TESTING CHECKLIST

* Location permission flow
* Accurate distance
* Map rendering
* Marker click
* Feed updates

---

# ✅ QUALITY CRITERIA

* Fast load (<1s)
* Smooth map interaction
* Accurate distance
* No UI lag

---

# ♻️ REUSABILITY RULES

* Separate:

  * location hook
  * map component
  * product service
* Avoid duplicating location logic

---

# 🧩 HOOKS DESIGN

## useLocation()

* get current location
* handle permission

---

## useNearbyProducts()

* fetch products by location

---

## useMapProducts()

* fetch by map region

---

# 🚀 EXAMPLE PROMPTS

* "Build map screen with product markers"
* "Create location-based product feed"
* "Implement GPS hook with Expo"

---

# 🔥 NEXT IMPROVEMENTS

* Heatmap of products
* Smart recommendations by location
* Nearby notifications
* Route to seller
