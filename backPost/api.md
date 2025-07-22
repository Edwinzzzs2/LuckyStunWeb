# BackPost API 文档

## 用户认证相关接口

### 登录
- **接口**：POST /api/auth/login
- **描述**：用户登录接口
- **请求体**：
```json
{
    "username": "string", // 用户名
    "password": "string"  // 密码
}
```

- **返回值**：
```json
{
    "token": "string", // JWT token，有效期1小时
    "user": {
        "id": "number",
        "username": "string",
        "isAdmin": "boolean"
    }
}
```

- **错误码**：
  - 400：请求参数错误
  - 401：用户名或密码错误
  - 500：服务器内部错误

### 注册
- **接口**：POST /api/auth/register
- **描述**：用户注册接口
- **请求体**：
```json
{
    "username": "string", // 用户名
    "password": "string", // 密码，至少6个字符
    "isAdmin": "boolean"  // 可选，是否为管理员，默认为false
}
```

- **返回值**：
```json
{
    "message": "string", // 注册成功
    "user": {
        "id": "number",
        "username": "string",
        "isAdmin": "boolean"
    }
}
```

- **错误码**：
  - 400：请求参数错误或密码长度不足
  - 409：用户名已存在
  - 500：服务器内部错误

### 创建管理员账户
- **接口**：POST /api/auth/create-admin
- **描述**：创建管理员账户（需要管理员权限）
- **请求体**：
```json
{
    "username": "string", // 用户名
    "password": "string"  // 密码，至少6个字符
}
```

- **返回值**：
```json
{
    "message": "string", // 管理员创建成功
    "user": {
        "id": "number",
        "username": "string",
        "isAdmin": "boolean"
    }
}
```

- **错误码**：
  - 400：请求参数错误或密码长度不足
  - 403：需要管理员权限
  - 409：用户名已存在
  - 500：服务器内部错误

### 获取当前用户信息
- **接口**：GET /api/auth/me
- **描述**：获取当前登录用户信息
- **返回值**：
```json
{
    "user": {
        "id": "number",
        "username": "string",
        "isAdmin": "boolean"
    }
}
```

- **错误码**：
  - 401：未授权或token已过期
  - 500：服务器内部错误

### 获取所有用户信息
- **接口**：GET /api/auth/users
- **描述**：获取系统中所有用户的信息（需要管理员权限）
- **返回值**：
```json
{
    "users": [
        {
            "id": "number",
            "username": "string",
            "isAdmin": "boolean",
            "createdAt": "string" // 创建时间
        }
    ]
}
```

- **错误码**：
  - 401：未授权或token已过期
  - 403：需要管理员权限
  - 500：服务器内部错误

### 删除用户
- **接口**：DELETE /api/auth/users/:id
- **描述**：删除指定用户（需要管理员权限，且不允许删除管理员账户）
- **参数**：
  - id：用户ID（路径参数）
- **返回值**：
```json
{
    "message": "string" // 用户删除成功
}
```

- **错误码**：
  - 403：需要管理员权限或尝试删除管理员账户
  - 404：用户不存在
  - 500：服务器内部错误

### 更新用户密码
- **接口**：POST /api/auth/update-password
- **描述**：更新当前登录用户的密码
- **请求体**：
```json
{
    "currentPassword": "string", // 当前密码
    "newPassword": "string"     // 新密码，至少6个字符
}
```

- **返回值**：
```json
{
    "message": "string" // 密码更新成功
}
```

- **错误码**：
  - 400：请求参数错误或新密码长度不足
  - 401：当前密码不正确
  - 404：用户不存在
  - 500：服务器内部错误

## 分类管理接口

### 获取分类树
- **接口**：GET /api/categories
- **描述**：获取所有分类的层级结构
- **返回值**：
```json
[
    {
        "id": "number",
        "name": "string",
        "en_name": "string",
        "icon": "string",
        "parent_id": "number|null",
        "sort_order": "number",
        "children": [] // 子分类数组
    }
]
```

### 获取扁平分类列表
- **接口**：GET /api/categories/flat
- **描述**：获取所有分类的扁平结构，适用于下拉选择
- **返回值**：
```json
[
    {
        "id": "number",
        "name": "string"
    }
]
```

### 创建分类
- **接口**：POST /api/categories
- **描述**：创建新分类（需要管理员权限）
- **请求体**：
```json
{
    "name": "string",         // 必填，分类名称
    "en_name": "string",      // 可选，英文名称
    "icon": "string",         // 可选，图标
    "parent_id": "number",    // 可选，父分类ID
    "sort_order": "number"    // 可选，排序顺序
}
```

- **返回值**：
```json
{
    "id": "number",
    "name": "string",
    "en_name": "string",
    "icon": "string",
    "parent_id": "number|null",
    "sort_order": "number"
}
```

- **错误码**：
  - 400：请求参数错误或父分类不存在
  - 403：需要管理员权限
  - 500：服务器内部错误

### 更新分类
- **接口**：POST /api/categories/update/:id
- **描述**：更新分类信息（需要管理员权限）
- **参数**：
  - id：分类ID（路径参数）
- **请求体**：
```json
{
    "name": "string",         // 必填，分类名称
    "en_name": "string",      // 可选，英文名称
    "icon": "string",         // 可选，图标
    "parent_id": "number",    // 可选，父分类ID
    "sort_order": "number"    // 可选，排序顺序
}
```

- **返回值**：
```json
{
    "message": "分类更新成功"
}
```

- **错误码**：
  - 400：请求参数错误或父分类不存在
  - 403：需要管理员权限
  - 404：分类不存在
  - 500：服务器内部错误

### 删除分类
- **接口**：POST /api/categories/delete/:id
- **描述**：删除分类（需要管理员权限）
- **参数**：
  - id：分类ID（路径参数）
- **返回值**：
```json
{
    "message": "分类删除成功"
}
```

- **错误码**：
  - 400：请求参数错误或存在子分类/关联网站
  - 403：需要管理员权限
  - 404：分类不存在
  - 500：服务器内部错误

## 网站管理接口

### 获取所有网站
- **接口**：GET /api/sites
- **描述**：获取所有网站列表
- **返回值**：
```json
[
    {
        "id": "number",
        "category_id": "number",
        "url": "string",
        "backup_url": "string",
        "internal_url": "string",
        "logo": "string",
        "title": "string",
        "desc": "string",
        "sort_order": "number",
        "is_visible": "boolean"
    }
]
```

### 获取网站详情
- **接口**：GET /api/sites/:id
- **描述**：获取单个网站详情
- **参数**：
  - id：网站ID（路径参数）
- **返回值**：
```json
{
    "id": "number",
    "category_id": "number",
    "url": "string",
    "backup_url": "string",
    "internal_url": "string",
    "logo": "string",
    "title": "string",
    "desc": "string",
    "sort_order": "number",
    "is_visible": "boolean"
}
```

### 创建网站
- **接口**：POST /api/sites
- **描述**：创建新网站（需要管理员权限）
- **请求体**：
```json
{
    "category_id": "number",   // 必填，分类ID
    "url": "string",          // 必填，网站URL
    "backup_url": "string",   // 可选，备用URL
    "internal_url": "string", // 可选，内网URL
    "logo": "string",         // 可选，Logo图片URL
    "title": "string",        // 必填，网站标题
    "desc": "string",         // 可选，网站描述
    "sort_order": "number",   // 可选，排序顺序，默认为0
    "is_visible": "boolean"   // 可选，网站显示状态，默认为true
}
```

- **返回值**：
```json
{
    "id": "number",
    "category_id": "number",
    "url": "string",
    "backup_url": "string",
    "internal_url": "string",
    "logo": "string",
    "title": "string",
    "desc": "string",
    "sort_order": "number",
    "is_visible": "boolean",
    "created_at": "string"
}
```

### 更新网站（方式一）
- **接口**：POST /api/sites/:id
- **描述**：更新网站信息（需要管理员权限）
- **参数**：
  - id：网站ID（路径参数）
- **请求体**：
```json
{
    "category_id": "number",   // 必填，分类ID
    "url": "string",          // 必填，网站URL
    "backup_url": "string",   // 可选，备用URL
    "internal_url": "string", // 可选，内网URL
    "logo": "string",         // 可选，Logo图片URL
    "title": "string",        // 必填，网站标题
    "desc": "string",         // 可选，网站描述
    "sort_order": "number",   // 可选，排序顺序
    "is_visible": "boolean"   // 可选，网站显示状态
}
```

- **返回值**：
```json
{
    "message": "网站更新成功"
}
```

### 更新网站（方式二）
- **接口**：POST /api/sites/update/:id
- **描述**：更新网站信息（需要管理员权限）
- **参数**：
  - id：网站ID（路径参数）
- **请求体**：同上
- **返回值**：同上

### 删除网站
- **接口**：POST /api/sites/delete/:id
- **描述**：删除网站（需要管理员权限）
- **参数**：
  - id：网站ID（路径参数）
- **返回值**：
```json
{
    "message": "网站删除成功"
}
```

### 批量更新站点分类
- **接口**：POST /api/sites/batch-update-category
- **描述**：批量更新多个站点的分类（需要管理员权限）
- **请求体**：
```json
{
    "site_ids": "number[]",   // 必填，站点ID列表
    "category_id": "number",  // 必填，目标分类ID
    "port": "number",         // 可选，端口号（0-65535）
    "is_visible": "boolean"   // 可选，显示状态
}
```

- **返回值**：
```json
{
    "message": "批量更新站点分类成功"
}
```

- **错误码**：
  - 400：请求参数错误或目标分类不存在
  - 404：未找到要更新的站点
  - 500：服务器内部错误

### 批量更新网站端口（高级版）
- **接口**：POST /api/sites/update-ports
- **描述**：批量更新指定域名和/或ID的网站URL端口号，支持主URL、备用URL和Logo URL的端口更新
- **请求体**：
```json
{
    "port": "number|null",    // 必填，新端口号（0-65535）或null（去除端口号）
    "domains": "string[]",    // 必填，目标域名列表
    "ids": "number[]"         // 可选，站点ID列表（与domains配合使用时为AND关系）
}
```

- **返回值**：
```json
{
    "code": "number",              // 0表示成功，1表示失败
    "message": "string",           // 操作结果描述
    "matched_sites": [             // 匹配到的站点信息
        {
            "id": "number",
            "url": "string",
            "backup_url": "string",
            "logo": "string",
            "needsUpdate": "boolean",  // 是否需要更新
            "changes": "string[]"      // 更新的字段列表
        }
    ],
    "updated_categories": "number[]", // 已更新的分类ID列表
    "failures": [                     // 失败的更新（仅在有失败时返回）
        {
            "id": "number",
            "error": "string"
        }
    ]
}
```

- **功能特性**：
  - 支持精确域名匹配和子域名匹配
  - 支持同时通过域名和ID过滤（AND关系）
  - 支持设置端口号或去除端口号（port为null）
  - 自动更新主URL、备用URL和Logo URL
  - 不会更新内网地址（internal_url）
  - 提供详细的匹配和更新信息

- **错误码**：
  - 400：请求参数错误（端口号无效、域名格式错误等）
  - 404：没有找到符合条件的网站
  - 500：服务器内部错误

## 重定向接口

### 获取站点URL信息
- **接口**：GET /api/redirect
- **描述**：获取指定站点ID的URL信息，用于页面跳转
- **参数**：
  - id：站点ID（查询参数）
- **返回值**：
```json
{
    "success": true,
    "data": {
        "id": "number",
        "url": "string",      // 站点URL
        "logo": "string",     // 站点Logo图片URL
        "title": "string",    // 站点标题
        "desc": "string"      // 站点描述
    }
}
```

- **错误情况**：
  - 无效ID：返回 400 状态码
    ```json
    {
        "success": false,
        "message": "无效的站点ID"
    }
    ```
  - 站点不存在：返回 200 状态码
    ```json
    {
        "success": false,
        "not_found": true,
        "message": "未找到ID为xxx的站点"
    }
    ```
  - 服务器错误：返回 500 状态码
    ```json
    {
        "success": false,
        "message": "获取站点URL信息失败"
    }
    ```

## 导航数据接口

### 获取导航数据
- **接口**：GET /api/navigation
- **描述**：获取完整的导航数据，包含分类和网站信息
- **返回值**：
```json
[
    {
        "name": "string",
        "en_name": "string",
        "icon": "string",
        "children": [         // 如果有子分类
            {
                "name": "string",
                "en_name": "string",
                "web": [      // 子分类下的网站
                    {
                        "url": "string",
                        "logo": "string",
                        "title": "string",
                        "desc": "string"
                    }
                ]
            }
        ],
        "web": []            // 如果没有子分类，直接包含网站列表
    }
]
```

## 注意事项

1. **认证要求**：
   - 标注"需要管理员权限"的接口需要在请求头中包含有效的JWT token
   - Token格式：`Authorization: Bearer <token>`

2. **响应格式**：
   - 所有接口的响应都会包含适当的HTTP状态码
   - 错误响应通常包含message字段说明错误原因

3. **数据库字段**：
   - `internal_url`：内网地址，不会被端口更新功能修改
   - `backup_url`：备用URL，会被端口更新功能处理
   - `is_visible`：网站显示状态，true=显示，false=隐藏

4. **URL处理**：
   - 所有URL字段都会进行格式验证
   - 端口更新功能使用标准URL解析，确保处理的准确性
