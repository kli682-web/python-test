# Forkcast 项目 API 接口文档

## 1. 全局说明

### 1.1 基础路径

所有 API 的基础路径为：`/api/v1`

### 1.2 统一响应格式

系统统一使用拦截器包装响应结果。

**成功响应模板 (Success)**

```
{
  "code": 200,
  "msg": "success",
  "data": { ... } // 具体数据，对象或数组
}
```

**失败响应模板 (Fail)**

```
{
  "code": 400, // 400 业务错误, 401 未授权, 403 无权限, 404 不存在, 500 服务器错误
  "msg": "error message description",
  "data": null
}
```

### 1.3 身份认证

需要登录的接口请在 HTTP Header 中携带 Token（“<>符号要去掉”）：

```
Authorization: Bearer <your_token>
```

## 2. 认证与用户模块 (Auth & User)

> 涉及数据表：`User`

### 2.1 用户注册（邮箱验证码流程）

后端不再使用单一的 POST /auth/register 接口。 标准的用户注册流程被实现为 两步验证流程
#### 2.1.1 发送验证码

- **接口地址**: `POST /auth/send-code`

- **是否需要认证**: 不需要

- **请求体**:

  ```
  {
    "email": "alan@example.com"
  }
  ```

- **接口行为说明**:

  - 后端在验证前会对邮箱进行 trim + lowercase 标准化处理。.
  - 只有未注册的邮箱地址才可以请求注册验证码.
  - 验证码为6位数字，并在5分钟后过期。

- **成功响应（200）**:

  ```
  {
    "code": 200,
    "msg": "Verification code sent",
    "data": {
      "email": "alan@example.com",
      "expiresIn": 300
    }
  }
  ```

- **Error Responses**:

  - `400`: `Valid email is required`
  - `409`: `Email is already registered`
  - `500`: Email sending failed or internal server error

#### 2.1.2 验证验证码并完成注册

- **接口地址**: `POST /auth/verify-code`

- **是否需要认证**: No

- **Request Body**:

  ```
  {
    "email": "alan@example.com",
    "code": "123456",
    "username": "alan",
    "password": "your_password",
    "avatar": "https://example.com/avatar.png",
    "role": "user"
  }
  ```

- **Required Fields**:

  - `email`
  - `code`
  - `username`
  - `password`

- **Behavior**:

  - 后端会检查验证码是否存在、是否过期以及是否匹配
  - 在创建用户之前，后端会同时检查邮箱唯一性和用户名唯一性.
  - 注册成功后，后端会立即返回 JWT Token 用于登录认证.

- **Success Response (201)**:

  ```
  {
    "code": 201,
    "msg": "Registration successful",
    "data": {
      "user": {
        "id": "65a1b2c3d4e5f6...",
        "username": "alan",
        "email": "alan@example.com",
        "role": "user",
        "avatar": "https://example.com/avatar.png"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

- **Error Responses**:

  - `400`: `Valid email is required` or `Email, code, username and password are required`
  - `401`: `Invalid verification code`
  - `404`: `Verification code not found`
  - `409`: `Email is already registered` or `Username already exists`
  - `410`: `Verification code has expired`
  - `500`: Internal server error

### 2.2 用户登录

- **Endpoint**: `POST /auth/login`

- **Auth Required**: No

- **Request Body**:

  ```
  {
    "email": "alan@example.com",
    "password": "your_password"
  }
  ```

- **Success Response (200)**:

  ```
  {
    "code": 200,
    "msg": "Login successful",
    "data": {
      "user": {
        "id": "65a1b2c3d4e5f6...",
        "username": "alan",
        "email": "alan@example.com",
        "role": "user",
        "avatar": "https://example.com/avatar.png"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

- **Error Responses**:

  - `400`: `Email and password are required`
  - `401`: `Invalid email or password`
  - `500`: Internal server error

### 2.3 Google 登录 / 自动注册

- **接口地址**: `POST /auth/google`

- **是否需要认证**: No

- **Request Body**:

  ```
  {
    "idToken": "google_id_token"
  }
  ```

- **Behavior**:

  - 后端会使用 GOOGLE_CLIENT_ID 对 Google idToken 进行合法性验证.
  - 如果系统中不存在该 Google 邮箱对应的本地用户，则后端会自动创建用户.
  - 自动创建的用户默认初始化以下字段： `email`, `username`, `avatar`, and `role`.

- **Success Response (200)**:

  ```
  {
    "code": 200,
    "msg": "Google login successful",
    "data": {
      "user": {
        "id": "65a1b2c3d4e5f6...",
        "username": "Alan",
        "email": "alan@example.com",
        "role": "user",
        "avatar": "https://lh3.googleusercontent.com/..."
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

- **Error Responses**:

  - `400`: `Google ID Token is required`
  - `401`: `Invalid Google token`

### 2.4 获取当前用户信息

- **接口路径**: `GET /users/me`

- **权限需求**: 需登录

- **成功响应 (200)**: 返回 User 表字段（不含 password）。

  ```
  {
    "code": 200,
    "msg": "success",
    "data": {
      "username": "alan",
      "email": "alan@example.com",
      "role": "user",
      "avatar": "[https://example.com/avatar.png](https://example.com/avatar.png)",
    }
  }
  ```

## 3. 用户档案模块 (User Profile)

> 涉及数据表：`UserProfile`

### 3.1 获取用户偏好设置

- **接口路径**: `GET /profile`

- **权限需求**: 需登录

- **成功响应 (200)**:

  ```
  {
    "code": 200,
    "msg": "success",
    "data": {
      "_id": "65b2c3d4e5f6a7...",
      "userId": "65a1b2c3d4e5f6...",
      "preferredCuisine": ["chinese", "japanese"],
      "defaultBudget": 20,
      "defaultDistance": 2,
      "favoriteFoodCategories": ["spicy", "sweet"]
    }
  }
  ```

### 3.2 更新用户偏好设置

- **接口路径**: `PUT /profile`

- **权限需求**: 需登录

- **请求体 (Body)**: (全部为可选字段)

  ```
  {
    "preferredCuisine": ["chinese", "fastfood"],
    "defaultBudget": 15,
    "defaultDistance": 1,
    "favoriteFoodCategories": ["spicy"]
  }
  ```

- **成功响应 (200)**: 返回更新后的 Profile 数据。(响应数据结构与 `3.1` 相同)

  ```
  {
    "code": 200,
    "msg": "更新成功",
    "data": {
      "_id": "65b2c3d4e5f6a7...",
      "userId": "65a1b2c3d4e5f6...",
      "preferredCuisine": ["chinese", "fastfood"],
      "defaultBudget": 15,
      "defaultDistance": 1,
      "favoriteFoodCategories": ["spicy"]
    }
  }
  ```

## 4. 餐厅与菜单模块 (Restaurant & Menu)

> 涉及数据表：`Restaurant`, `Menu`

### 4.1 获取餐厅列表 (支持搜索与过滤)

- **接口路径**: `GET /restaurants`

- **权限需求**: 无

- **查询参数 (Query)**: **均为可选参数，支持零个或多个参数组合查询（例如：`?cuisine=chinese&priceRange=low&maxDistance=1.5`）**

    - `keyword` (String) - 搜索餐厅名称
    - `cuisine` (String) - 按菜系筛选 (如 chinese)
    - `maxDistance` (Number) - 最大距离限制 (如 2.0，单位 km)
    - `priceRange` (String) - 价格档位 (low/medium/high)
    - `isCampusVendor` (Boolean) - 是否仅看校园商家 (true/false)

- **成功响应 (200)**: 返回餐厅数组（简略信息）。为方便前端调试，以下提供包含不同特征的多组数据示例：

  ```
  {
    "code": 200,
    "msg": "success",
    "data": [
      {
        "_id": "65c111...",
        "name": "Campus Noodle House",
        "location": { 
          "address": "1 University Road", 
          "distanceFromCampus": 0.4 
        },
        "rating": 4.5,
        "priceRange": "low",
        "cuisineTypes": ["chinese", "asian"],
        "isCampusVendor": true,
        "isAvailable": true
      },
      {
        "_id": "65c222...",
        "name": "Symonds Burger & Grill",
        "location": { 
          "address": "25 Symonds St", 
          "distanceFromCampus": 1.2 
        },
        "rating": 4.2,
        "priceRange": "medium",
        "cuisineTypes": ["western", "fastfood"],
        "isCampusVendor": false,
        "isAvailable": true
      },
      {
        "_id": "65c333...",
        "name": "Uni Sushi Shop",
        "location": { 
          "address": "Student Union Building", 
          "distanceFromCampus": 0.1 
        },
        "rating": 4.8,
        "priceRange": "low",
        "cuisineTypes": ["japanese"],
        "isCampusVendor": true,
        "isAvailable": false
      }
    ]
  }
  ```

### 4.2 获取餐厅详情

- **接口路径**: `GET /restaurants/:id`

- **权限需求**: 无

- **成功响应 (200)**: 返回完整的单个 `Restaurant` 对象，包含营业时间、经纬度等详细信息。

  ```
  {
    "code": 200,
    "msg": "success",
    "data": {
      "_id": "65c111...",
      "name": "Campus Noodle House",
      "location": {
        "address": "1 University Road, Auckland",
        "geo": { "type": "Point", "coordinates": [174.7633, -36.8485] },
        "distanceFromCampus": 0.4,
        "googleMapsUrl": "[https://maps.google.com/](https://maps.google.com/)..."
      },
      "cuisineTypes": ["chinese", "asian"],
      "priceRange": "low",
      "rating": 4.5,
      "openingHours": [
        { "day": "Mon", "open": "09:00", "close": "18:00" },
        { "day": "Tue", "open": "09:00", "close": "18:00" }
      ],
      "isCampusVendor": true,
      "isAvailable": true
    }
  }
  ```

### 4.3 获取指定餐厅菜单

- **接口路径**: `GET /restaurants/:id/menus`

- **权限需求**: 无

- **查询参数 (Query)**: `category` (可选，如 `?category=spicy` 仅看特定分类)

- **成功响应 (200)**: 返回该餐厅的菜单列表。

  ```
  {
    "code": 200,
    "msg": "success",
    "data": [
      {
        "_id": "65d111...",
        "name": "Spicy Beef Noodles",
        "category": "spicy",
        "price": 15.5,
        "rating": 4.7,
        "isAvailable": true
      },
      {
        "_id": "65d222...",
        "name": "Pork Dumplings",
        "category": "dimsum",
        "price": 12.0,
        "rating": 4.5,
        "isAvailable": true
      }
    ]
  }
  ```

## 6. 收藏夹模块 (Favorites)

> 涉及数据表：`Favorite`

### 6.1 添加收藏

- **接口路径**: `POST /favorites`

- **权限需求**: 需登录

- **请求体 (Body)**:

  ```
  {
    "restaurantId": "65c111..."
  }
  ```

- **成功响应 (200)**:

  ```
  { 
    "code": 200, 
    "msg": "收藏成功", 
    "data": { 
      "_id": "65a999...", 
      "userId": "65a1b2c...",
      "restaurantId": "65c111..."
    } 
  }
  ```

### 6.2 取消收藏

- **接口路径**: `DELETE /favorites/:restaurantId`

- **权限需求**: 需登录

- **成功响应 (200)**: 返回空数据表示删除成功。

  ```
  { 
    "code": 200, 
    "msg": "已取消收藏", 
    "data": null 
  }
  ```

### 6.3 获取我的收藏列表

- **接口路径**: `GET /favorites`

- **权限需求**: 需登录

- **成功响应 (200)**:

  *说明：建议后端在查询时通过 MongoDB 的 `populate` 方法将 `restaurantId` 映射为具体的餐厅简略信息，方便前端直接渲染卡片。*

  ```
  {
    "code": 200,
    "msg": "success",
    "data": [
      {
        "_id": "65a999...",
        "savedAt": "2024-03-20T14:00:00Z",
        "restaurant": {
          "_id": "65c111...",
          "name": "Campus Noodle House",
          "rating": 4.5,
          "priceRange": "low",
          "location": { "distanceFromCampus": 0.4 }
        }
      },
      {
        "_id": "65a888...",
        "savedAt": "2024-03-19T09:30:00Z",
        "restaurant": {
          "_id": "65c333...",
          "name": "Uni Sushi Shop",
          "rating": 4.8,
          "priceRange": "low",
          "location": { "distanceFromCampus": 0.1 }
        }
      }
    ]
  }
  ```

