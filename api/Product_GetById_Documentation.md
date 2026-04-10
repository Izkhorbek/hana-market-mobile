# Product GetById API Documentation

## Endpoint

```
GET /api/product/{id}
```

Get detailed information about a specific product by ID. The response structure varies based on the product type.

---

## Authentication

**Required**: Yes  
**Authorization**: Bearer Token (USER_ROLE)

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | long | Yes | Product ID |

### Headers

```http
Authorization: Bearer {your_jwt_token}
User-Agent: {client_user_agent}
```

---

## Response Structure

The API returns different data structures based on `product_type`:

### Common Fields (All Product Types)

```json
{
  "data": {
    "id": 123,
    "user_id": 456,
    "category_id": 1,
    "category_name_uz": "Avtomobillar",
    "category_name_ru": "¬¡¬Ó¬ä¬à¬Þ¬à¬Ò¬Ú¬Ý¬Ú",
    "title": "Product title",
    "description": "Product description",
    "moljal": "Near Central Park",
    "is_free": false,
    "is_negotiable": true,
    "status": "active",
    "views_count": 150,
    "likes_count": 25,
    "is_liked": true,
    "main_image_url": "https://example.com/images/product.jpg",
    "images": [
      "https://example.com/images/1.jpg",
      "https://example.com/images/2.jpg"
    ],
    "latitude": 41.2995,
    "longitude": 69.2401,
    "distance": "2.5 km",
    "price": "50,000,000 so'm",
    "product_type": 1000,
    "product_type_name": "Car",
    "created_ago": "2 hours ago",
    "seller": {
      "username": "john_doe",
      "first_name": "John",
      "last_name": "Doe",
      "address_name": "Tashkent, Yunusabad",
      "profile_image_url": "https://example.com/avatar.jpg",
      "is_verified": true
    }
  },
  "message": "Success",
  "status": 200
}
```

---

## Product Type Specific Data

### 1. **Thing (Generic Product)** - `product_type: 1`

**Description**: General items like electronics, furniture, clothes, etc.

**Additional Fields**: None

**Example Request**:
```http
GET /api/product/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "data": {
    "id": 123,
    "user_id": 456,
    "category_id": 5,
    "category_name_uz": "Elektronika",
    "category_name_ru": "¬¿¬Ý¬Ö¬Ü¬ä¬â¬à¬ß¬Ú¬Ü¬Ñ",
    "title": "iPhone 14 Pro Max",
    "description": "256GB, Pacific Blue, like new condition",
    "moljal": "Chilonzor metro station",
    "is_free": false,
    "is_negotiable": true,
    "status": "active",
    "views_count": 245,
    "likes_count": 18,
    "is_liked": false,
    "main_image_url": "https://cdn.example.com/iphone14.jpg",
    "images": [
      "https://cdn.example.com/iphone14-1.jpg",
      "https://cdn.example.com/iphone14-2.jpg",
      "https://cdn.example.com/iphone14-3.jpg"
    ],
    "latitude": 41.2856,
    "longitude": 69.2034,
    "distance": "5.2 km",
    "price": "12,500,000 so'm",
    "product_type": 1,
    "product_type_name": "Thing",
    "created_ago": "3 days ago",
    "seller": {
      "username": "tech_seller",
      "first_name": "Aziz",
      "last_name": "Karimov",
      "address_name": "Tashkent, Chilonzor",
      "profile_image_url": "https://cdn.example.com/avatar123.jpg",
      "is_verified": true
    }
  },
  "message": "Success",
  "status": 200
}
```

---

### 2. **Car** - `product_type: 1000`

**Description**: Automobile listings with detailed car specifications.

**Additional Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `car_brand` | string | Car manufacturer (BMW, Toyota, etc.) |
| `car_model` | string | Car model (X5, Camry, etc.) |
| `car_data` | object | Detailed car specifications |
| `car_data.year` | int | Manufacturing year |
| `car_data.mileage` | int | Kilometers driven |
| `car_data.fuel_type` | object | Fuel type enum |
| `car_data.car_transmission` | object | Transmission type enum |
| `car_data.car_condition` | object | Car condition enum |

**Enum Values**:

```typescript
// Fuel Type
enum ECarFuelType {
  Petrol = 0,
  Diesel = 1,
  Electric = 2,
  Hybrid = 3,
  Gas = 4
}

// Transmission
enum ECarTransmissionType {
  Manual = 0,
  Automatic = 1,
  SemiAutomatic = 2
}

// Condition
enum ECarCondition {
  New = 0,
  Used = 1,
  Damaged = 2
}
```

**Example Request**:
```http
GET /api/product/456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "data": {
    "id": 456,
    "user_id": 789,
    "category_id": 1,
    "category_name_uz": "Avtomobillar",
    "category_name_ru": "¬¡¬Ó¬ä¬à¬Þ¬à¬Ò¬Ú¬Ý¬Ú",
    "title": "BMW X5",
    "description": "Excellent condition, full option, garage kept",
    "moljal": "Sergeli metro",
    "is_free": false,
    "is_negotiable": true,
    "status": "active",
    "views_count": 523,
    "likes_count": 67,
    "is_liked": true,
    "main_image_url": "https://cdn.example.com/bmw-x5-main.jpg",
    "images": [
      "https://cdn.example.com/bmw-x5-1.jpg",
      "https://cdn.example.com/bmw-x5-2.jpg",
      "https://cdn.example.com/bmw-x5-3.jpg",
      "https://cdn.example.com/bmw-x5-4.jpg",
      "https://cdn.example.com/bmw-x5-5.jpg"
    ],
    "latitude": 41.2256,
    "longitude": 69.2267,
    "distance": "8.7 km",
    "price": "$45,000",
    "product_type": 1000,
    "product_type_name": "Car",
    "car_brand": "BMW",
    "car_model": "X5",
    "car_data": {
      "year": 2020,
      "mileage": 45000,
      "fuel_type": {
        "value": 0,
        "name": "Petrol",
        "description": "Petrol"
      },
      "car_transmission": {
        "value": 1,
        "name": "Automatic",
        "description": "Automatic"
      },
      "car_condition": {
        "value": 1,
        "name": "Used",
        "description": "Used"
      }
    },
    "created_ago": "1 week ago",
    "seller": {
      "username": "car_dealer_uz",
      "first_name": "Rustam",
      "last_name": "Mahmudov",
      "address_name": "Tashkent, Sergeli",
      "profile_image_url": "https://cdn.example.com/dealer-avatar.jpg",
      "is_verified": true
    }
  },
  "message": "Success",
  "status": 200
}
```

---

### 3. **Work/Job** - `product_type: 1010`

**Description**: Job listings and work opportunities.

**Additional Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `work_type` | string | Type of work (IT, Construction, etc.) |
| `work_condition` | string | Work arrangement (temporary, permanent, etc.) |
| `work_data` | object | Detailed job specifications |
| `work_data.worker_type` | object | Worker type enum |
| `work_data.salary_type` | object | Salary type enum |
| `work_data.payment_type` | object | Payment type enum |
| `work_data.payment_time_type` | object | Payment frequency enum |
| `work_data.working_days_hours` | string | Working schedule |
| `work_data.employer_information` | string | About the employer |
| `work_data.workplace_information` | string | Workplace details |
| `work_data.salary_amount` | decimal | Salary amount |
| `work_data.phone_number` | string | Contact number |
| `work_data.work_ethics` | string | Work ethics/requirements |

**Enum Values**:

```typescript
// Worker Type
enum EWorkerType {
  Employer = 0,      // Hiring
  Employee = 1       // Looking for work
}

// Salary Type
enum EWorkSalaryType {
  Fixed = 0,         // Fixed salary
  Hourly = 1,        // Per hour
  PerProject = 2     // Per project
}

// Payment Type
enum EPaymentType {
  Cash = 0,
  Card = 1,
  Bank = 2
}

// Payment Time
enum EPaymentTimeType {
  Daily = 0,
  Weekly = 1,
  Monthly = 2,
  AfterCompletion = 3
}

// Work Type
enum EWorkType {
  IT = 0,
  Construction = 1,
  Teaching = 2,
  Sales = 3,
  Healthcare = 4,
  // ... other work types
}

// Work Condition
enum EWorkCondition {
  Temporary = 0,
  OneMonth = 1,
  LongTerm = 2,
  Permanent = 3
}
```

**Example Request**:
```http
GET /api/product/789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response (Employer - Hiring)**:
```json
{
  "data": {
    "id": 789,
    "user_id": 321,
    "category_id": 10,
    "category_name_uz": "Ish",
    "category_name_ru": "¬²¬Ñ¬Ò¬à¬ä¬Ñ",
    "title": "Full Stack Developer needed",
    "description": "We are looking for an experienced Full Stack Developer proficient in React and Node.js",
    "moljal": "IT Park Tashkent",
    "is_free": false,
    "is_negotiable": true,
    "status": "active",
    "views_count": 892,
    "likes_count": 134,
    "is_liked": false,
    "main_image_url": "https://cdn.example.com/it-company-logo.jpg",
    "images": [
      "https://cdn.example.com/office-1.jpg",
      "https://cdn.example.com/office-2.jpg"
    ],
    "latitude": 41.3111,
    "longitude": 69.2797,
    "distance": "3.2 km",
    "price": "8,000,000 so'm",
    "product_type": 1010,
    "product_type_name": "Work",
    "work_type": "0",
    "work_condition": "3",
    "work_data": {
      "worker_type": {
        "value": 0,
        "name": "Employer",
        "description": "Employer"
      },
      "salary_type": {
        "value": 0,
        "name": "Fixed",
        "description": "Fixed"
      },
      "payment_type": {
        "value": 2,
        "name": "Bank",
        "description": "Bank"
      },
      "payment_time_type": {
        "value": 2,
        "name": "Monthly",
        "description": "Monthly"
      },
      "working_days_hours": "Mon-Fri, 9:00-18:00",
      "employer_information": "Tech Solutions LLC - Leading IT company in Uzbekistan",
      "workplace_information": "Modern office in IT Park with all amenities",
      "salary_amount": 8000000,
      "phone_number": "+998901234567",
      "work_ethics": "Punctuality, teamwork, continuous learning"
    },
    "created_ago": "5 hours ago",
    "seller": {
      "username": "tech_solutions_uz",
      "first_name": "Sardor",
      "last_name": "Aliyev",
      "address_name": "Tashkent, Mirzo Ulugbek",
      "profile_image_url": "https://cdn.example.com/hr-manager.jpg",
      "is_verified": true
    }
  },
  "message": "Success",
  "status": 200
}
```

**Example Response (Employee - Looking for Work)**:
```json
{
  "data": {
    "id": 790,
    "user_id": 654,
    "category_id": 10,
    "category_name_uz": "Ish",
    "category_name_ru": "¬²¬Ñ¬Ò¬à¬ä¬Ñ",
    "title": "Experienced React Developer seeking opportunities",
    "description": "5 years of experience in React, TypeScript, Next.js. Available for full-time or contract work",
    "moljal": "Yunusabad district",
    "is_free": false,
    "is_negotiable": true,
    "status": "active",
    "views_count": 156,
    "likes_count": 23,
    "is_liked": false,
    "main_image_url": "https://cdn.example.com/developer-portfolio.jpg",
    "images": [
      "https://cdn.example.com/portfolio-1.jpg",
      "https://cdn.example.com/portfolio-2.jpg"
    ],
    "latitude": 41.3375,
    "longitude": 69.2892,
    "distance": "1.8 km",
    "price": "10,000,000 so'm",
    "product_type": 1010,
    "product_type_name": "Work",
    "work_type": "0",
    "work_condition": "2",
    "work_data": {
      "worker_type": {
        "value": 1,
        "name": "Employee",
        "description": "Employee"
      },
      "salary_type": {
        "value": 0,
        "name": "Fixed",
        "description": "Fixed"
      },
      "payment_type": {
        "value": 2,
        "name": "Bank",
        "description": "Bank"
      },
      "payment_time_type": {
        "value": 2,
        "name": "Monthly",
        "description": "Monthly"
      },
      "working_days_hours": "Flexible, can work remotely",
      "employer_information": null,
      "workplace_information": "Can work on-site or remotely",
      "salary_amount": 10000000,
      "phone_number": "+998909876543",
      "work_ethics": "Professional, reliable, deadline-oriented"
    },
    "created_ago": "2 days ago",
    "seller": {
      "username": "dev_akmal",
      "first_name": "Akmal",
      "last_name": "Saidov",
      "address_name": "Tashkent, Yunusabad",
      "profile_image_url": "https://cdn.example.com/akmal-avatar.jpg",
      "is_verified": false
    }
  },
  "message": "Success",
  "status": 200
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "data": "Unauthorized user.",
  "message": null,
  "status": 401
}
```

### 404 Not Found

```json
{
  "data": "Not Found",
  "message": null,
  "status": 404
}
```

### 500 Internal Server Error

```json
{
  "data": "Failed to retrieve product. Please try again.",
  "message": null,
  "status": 500
}
```

---

## Frontend Integration Examples

### React/TypeScript

```typescript
// Type Definitions
interface SellerInfo {
  username: string;
  first_name: string;
  last_name: string;
  address_name: string;
  profile_image_url: string;
  is_verified: boolean;
}

interface BaseProduct {
  id: number;
  user_id: number;
  category_id: number;
  category_name_uz: string;
  category_name_ru: string;
  title: string;
  description: string;
  moljal: string;
  is_free: boolean;
  is_negotiable: boolean;
  status: string;
  views_count: number;
  likes_count: number;
  is_liked: boolean;
  main_image_url: string;
  images: string[];
  latitude: number;
  longitude: number;
  distance: string;
  price?: string;
  product_type: number;
  product_type_name: string;
  created_ago: string;
  seller: SellerInfo;
}

interface EnumValue {
  value: number;
  name: string;
  description: string;
}

interface CarData {
  year: number;
  mileage: number;
  fuel_type: EnumValue;
  car_transmission: EnumValue;
  car_condition: EnumValue;
}

interface CarProduct extends BaseProduct {
  car_brand: string;
  car_model: string;
  car_data: CarData;
}

interface WorkData {
  worker_type: EnumValue;
  salary_type: EnumValue;
  payment_type: EnumValue;
  payment_time_type: EnumValue | null;
  working_days_hours: string;
  employer_information: string | null;
  workplace_information: string;
  salary_amount: number;
  phone_number: string;
  work_ethics: string;
}

interface WorkProduct extends BaseProduct {
  work_type: string;
  work_condition: string;
  work_data: WorkData;
}

type Product = BaseProduct | CarProduct | WorkProduct;

// API Service
const getProductById = async (id: number): Promise<Product> => {
  const response = await fetch(`/api/product/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  
  const result = await response.json();
  return result.data;
};

// React Component
const ProductDetails: React.FC<{ productId: number }> = ({ productId }) => {
  const [product, setProduct] = useState<Product | null>(null);
  
  useEffect(() => {
    getProductById(productId)
      .then(setProduct)
      .catch(console.error);
  }, [productId]);
  
  if (!product) return <div>Loading...</div>;
  
  // Render based on product type
  switch (product.product_type) {
    case 1: // Thing
      return <ThingProductView product={product} />;
    
    case 1000: // Car
      return <CarProductView product={product as CarProduct} />;
    
    case 1010: // Work
      return <WorkProductView product={product as WorkProduct} />;
    
    default:
      return <div>Unknown product type</div>;
  }
};

// Car Product Component
const CarProductView: React.FC<{ product: CarProduct }> = ({ product }) => {
  return (
    <div>
      <h1>{product.car_brand} {product.car_model}</h1>
      <p>{product.description}</p>
      <div>
        <p>Year: {product.car_data.year}</p>
        <p>Mileage: {product.car_data.mileage.toLocaleString()} km</p>
        <p>Fuel Type: {product.car_data.fuel_type.description}</p>
        <p>Transmission: {product.car_data.car_transmission.description}</p>
        <p>Condition: {product.car_data.car_condition.description}</p>
      </div>
      <p>Price: {product.price}</p>
    </div>
  );
};

// Work Product Component
const WorkProductView: React.FC<{ product: WorkProduct }> = ({ product }) => {
  return (
    <div>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <div>
        <p>Type: {product.work_data.worker_type.description}</p>
        <p>Salary: {product.price} ({product.work_data.salary_type.description})</p>
        <p>Payment: {product.work_data.payment_type.description}</p>
        <p>Schedule: {product.work_data.working_days_hours}</p>
        <p>Contact: {product.work_data.phone_number}</p>
      </div>
    </div>
  );
};
```

### React Native

```typescript
import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from 'react-native';

const ProductDetailScreen = ({ route }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProduct();
  }, [productId]);
  
  const fetchProduct = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`https://api.example.com/api/product/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      setProduct(result.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <ActivityIndicator />;
  }
  
  const renderProductDetails = () => {
    switch (product.product_type) {
      case 1000: // Car
        return (
          <View>
            <Text style={styles.title}>
              {product.car_brand} {product.car_model}
            </Text>
            <Text>Year: {product.car_data.year}</Text>
            <Text>Mileage: {product.car_data.mileage} km</Text>
            <Text>Fuel: {product.car_data.fuel_type.description}</Text>
          </View>
        );
      
      case 1010: // Work
        return (
          <View>
            <Text style={styles.title}>{product.title}</Text>
            <Text>Salary: {product.price}</Text>
            <Text>Schedule: {product.work_data.working_days_hours}</Text>
            <Text>Contact: {product.work_data.phone_number}</Text>
          </View>
        );
      
      default: // Thing
        return (
          <View>
            <Text style={styles.title}>{product.title}</Text>
            <Text>{product.description}</Text>
          </View>
        );
    }
  };
  
  return (
    <ScrollView>
      <Image source={{ uri: product.main_image_url }} style={styles.image} />
      {renderProductDetails()}
      <Text>Views: {product.views_count}</Text>
      <Text>Likes: {product.likes_count}</Text>
      <Text>Distance: {product.distance}</Text>
    </ScrollView>
  );
};
```

---

## Notes

1. **View Tracking**: Each product view is tracked asynchronously and won't affect response time.

2. **Distance Calculation**: The `distance` field is formatted in Uzbek/Russian style (e.g., "2.5 km", "500 m").

3. **Price Formatting**: Prices are formatted according to currency type:
   - UZS: "50,000,000 so'm"
   - USD: "$45,000"

4. **Image URLs**: All image URLs are absolute paths ready to use in `<img>` tags or React Native `<Image>` components.

5. **Enum Values**: All enum fields include:
   - `value`: Numeric enum value
   - `name`: English name
   - `description`: Localized description

6. **Seller Information**: Always included for all product types.

7. **Authentication**: Viewing product details requires authentication. Anonymous viewing is not supported for this endpoint.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial documentation |

---

**For Questions**: Contact the backend team or refer to the main API documentation.
