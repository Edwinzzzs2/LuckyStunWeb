## Edwinzzzs2
复制

删除

把当前项目的接口，提供一个文档给我，包括入参，返回体等

## Trae AI
参考了 1 个上下文

server.js 484-484

好的，我来为您整理一份详细的 API 文档。

# BackPost API 文档
## 用户认证相关接口
### 登录
- 接口 ： POST /api/auth/login
- 描述 ：用户登录接口
- 请求体 ：
```json
{
    "username": "string", // 用户名
    "password": "string"  // 密码
}
 ```

- 返回值 ：
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

- 错误码 ：
  - 400 ：请求参数错误
  - 401 ：用户名或密码错误
  - 500 ：服务器内部错误

### 注册
- 接口 ： POST /api/auth/register
- 描述 ：用户注册接口
- 请求体 ：
```json
{
    "username": "string", // 用户名
    "password": "string", // 密码，至少6个字符
    "isAdmin": "boolean"  // 可选，是否为管理员，默认为false
}
 ```

- 返回值 ：
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

- 错误码 ：
  - 400 ：请求参数错误或密码长度不足
  - 409 ：用户名已存在
  - 500 ：服务器内部错误

### 创建管理员账户
- 接口 ： POST /api/auth/create-admin
- 描述 ：创建管理员账户（需要管理员权限）
- 请求体 ：
```json
{
    "username": "string", // 用户名
    "password": "string"  // 密码，至少6个字符
}
 ```

- 返回值 ：
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

- 错误码 ：
  - 400 ：请求参数错误或密码长度不足
  - 403 ：需要管理员权限
  - 409 ：用户名已存在
  - 500 ：服务器内部错误

### 获取当前用户信息
- 接口 ： GET /api/auth/me
- 描述 ：获取当前登录用户信息
- 返回值 ：
```json
{
    "user": {
        "id": "number",
        "username": "string",
        "isAdmin": "boolean"
    }
}
 ```

- 错误码 ：
  - 401 ：未授权或token已过期
  - 500 ：服务器内部错误

### 删除用户
- 接口 ： DELETE /api/auth/users/:id
- 描述 ：删除指定用户（需要管理员权限，且不允许删除管理员账户）
- 参数 ：
  - id ：用户ID（路径参数）
- 返回值 ：
```json
{
    "message": "string" // 用户删除成功
}
 ```

- 错误码 ：
  - 403 ：需要管理员权限或尝试删除管理员账户
  - 404 ：用户不存在
  - 500 ：服务器内部错误

### 更新用户密码
- 接口 ： POST /api/auth/update-password
- 描述 ：更新当前登录用户的密码
- 请求体 ：
```json
{
    "currentPassword": "string", // 当前密码
    "newPassword": "string"     // 新密码，至少6个字符
}
 ```

- 返回值 ：
```json
{
    "message": "string" // 密码更新成功
}
 ```

- 错误码 ：
  - 400 ：请求参数错误或新密码长度不足
  - 401 ：当前密码不正确
  - 404 ：用户不存在
  - 500 ：服务器内部错误

## 分类管理接口
### 获取分类树
- 接口 ： GET /api/categories
- 描述 ：获取所有分类的层级结构
- 返回值 ：
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
- 接口 ： GET /api/categories/flat
- 描述 ：获取所有分类的扁平结构，适用于下拉选择
- 返回值 ：
```json
[
    {
        "id": "number",
        "name": "string"
    }
]
 ```

### 创建分类
- 接口 ： POST /api/categories
- 描述 ：创建新分类（需要管理员权限）
- 请求体 ：
```json
{
    "name": "string",         // 必填，分类名称
    "en_name": "string",      // 可选，英文名称
    "icon": "string",         // 可选，图标
    "parent_id": "number",    // 可选，父分类ID
    "sort_order": "number"    // 可选，排序顺序
}
 ```

- 返回值 ：
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

- 错误码 ：
  - 400 ：请求参数错误或父分类不存在
  - 403 ：需要管理员权限
  - 500 ：服务器内部错误

### 更新分类
- 接口 ： POST /api/categories/update/:id
- 描述 ：更新分类信息（需要管理员权限）
- 参数 ：
  - id ：分类ID（路径参数）
- 请求体 ：
```json
{
    "name": "string",         // 必填，分类名称
    "en_name": "string",      // 可选，英文名称
    "icon": "string",         // 可选，图标
    "parent_id": "number",    // 可选，父分类ID
    "sort_order": "number"    // 可选，排序顺序
}
 ```

- 返回值 ：
```json
{
    "message": "分类更新成功"
}
 ```

- 错误码 ：
  - 400 ：请求参数错误或父分类不存在
  - 403 ：需要管理员权限
  - 404 ：分类不存在
  - 500 ：服务器内部错误

### 删除分类
- 接口 ： POST /api/categories/delete/:id
- 描述 ：删除分类（需要管理员权限）
- 参数 ：
  - id ：分类ID（路径参数）
- 返回值 ：
```json
{
    "message": "分类删除成功"
}
 ```

- 错误码 ：
  - 400 ：请求参数错误或存在子分类/关联网站
  - 403 ：需要管理员权限
  - 404 ：分类不存在
  - 500 ：服务器内部错误

## 网站管理接口
### 获取网站列表
- 接口 ： GET /api/sites
- 描述 ：获取所有网站列表
- 返回值 ：
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
        "update_port_enabled": "boolean"
    }
]
 ```

### 获取单个网站详情
- 接口 ： GET /api/sites/:id
- 描述 ：获取单个网站详情
- 参数 ：
  - id ：网站ID（路径参数）
- 返回值 ：
```json
{
    "id": "number",
    "category_id": "number",
    "category_name": "string",
    "url": "string",
    "backup_url": "string",
    "internal_url": "string",
    "logo": "string",
    "title": "string",
    "desc": "string",
    "sort_order": "number",
    "update_port_enabled": "boolean"
}
 ```

- 错误码 ：
  - 400 ：无效的网站ID
  - 404 ：未找到指定网站
  - 500 ：服务器内部错误

### 创建网站
- 接口 ： POST /api/sites
- 描述 ：创建新网站（需要管理员权限）
- 请求体 ：
```json
{
    "category_id": "number",     // 必填，分类ID
    "url": "string",            // 必填，网站URL
    "title": "string",          // 必填，网站标题
    "backup_url": "string",     // 可选，备用URL
    "internal_url": "string",   // 可选，内部URL
    "logo": "string",           // 可选，网站图标
    "desc": "string",           // 可选，网站描述
    "sort_order": "number",     // 可选，排序顺序
    "update_port_enabled": "boolean" // 可选，是否启用端口更新
}
 ```

- 返回值 ：
```json
{
    "id": "number",
    "message": "string"
}
 ```

- 错误码 ：
  - 400 ：请求参数错误或指定的分类不存在
  - 403 ：需要管理员权限
  - 500 ：服务器内部错误

### 更新网站
- 接口 ： POST /api/sites/update/:id
- 描述 ：更新网站信息（需要管理员权限）
- 参数 ：
  - id ：网站ID（路径参数）
- 请求体 ：
```json
{
    "category_id": "number",     // 必填，分类ID
    "url": "string",            // 必填，网站URL
    "title": "string",          // 必填，网站标题
    "backup_url": "string",     // 可选，备用URL
    "internal_url": "string",   // 可选，内部URL
    "logo": "string",           // 可选，网站图标
    "desc": "string",           // 可选，网站描述
    "sort_order": "number",     // 可选，排序顺序
    "update_port_enabled": "boolean" // 可选，是否启用端口更新
}
 ```

- 返回值 ：
```json
{
    "message": "string"
}
 ```

- 错误码 ：
  - 400 ：请求参数错误或指定的分类不存在
  - 403 ：需要管理员权限
  - 404 ：未找到要更新的网站
  - 500 ：服务器内部错误

### 删除网站
- 接口 ： DELETE /api/sites/:id
- 描述 ：删除网站（需要管理员权限）
- 参数 ：
  - id ：网站ID（路径参数）
- 返回值 ：
```json
{
    "message": "string"
}
 ```

- 错误码 ：
  - 400 ：无效的网站ID
  - 403 ：需要管理员权限
  - 404 ：未找到要删除的网站
  - 500 ：服务器内部错误

## 导航数据接口
### 获取导航数据
- 接口 ： GET /api/navigation
- 描述 ：获取完整的导航数据，包含分类和网站信息
- 返回值 ：
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

注意：

1. 所有接口的响应都会包含适当的 HTTP 状态码
2. 错误响应通常包含 message 字段说明错误原因
3. 部分接口的请求和响应可能包含额外的字段，这里只列出了主要字段
4. 需要管理员权限的接口需要在请求头中包含有效的JWT token

### 站点管理 API

#### 1. 获取所有站点列表
```
GET /api/sites

响应示例：
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
        "update_port_enabled": "boolean"
    }
]
```

#### 2. 获取单个站点详情
```
GET /api/sites/:id

响应示例：
{
    "id": "number",
    "category_id": "number",
    "category_name": "string",
    "url": "string",
    "backup_url": "string",
    "internal_url": "string",
    "logo": "string",
    "title": "string",
    "desc": "string",
    "sort_order": "number",
    "update_port_enabled": "boolean"
}
```

#### 3. 添加新站点
```
POST /api/sites

请求体：
{
    "category_id": "number",     // 必填，分类ID
    "url": "string",            // 必填，网站URL
    "title": "string",          // 必填，网站标题
    "backup_url": "string",     // 可选，备用URL
    "internal_url": "string",   // 可选，内部URL
    "logo": "string",           // 可选，网站图标
    "desc": "string",           // 可选，网站描述
    "sort_order": "number",     // 可选，排序顺序
    "update_port_enabled": "boolean" // 可选，是否启用端口更新
}

响应示例：
{
    "id": "number",
    "message": "string"
}
```

#### 4. 更新站点信息
```
PUT /api/sites/:id
或
POST /api/sites/update/:id

请求体：
{
    "category_id": "number",     // 必填，分类ID
    "url": "string",            // 必填，网站URL
    "title": "string",          // 必填，网站标题
    "backup_url": "string",     // 可选，备用URL
    "internal_url": "string",   // 可选，内部URL
    "logo": "string",           // 可选，网站图标
    "desc": "string",           // 可选，网站描述
    "sort_order": "number",     // 可选，排序顺序
    "update_port_enabled": "boolean" // 可选，是否启用端口更新
}

响应示例：
{
    "message": "string"
}
```

#### 5. 删除站点
```
DELETE /api/sites/:id

响应示例：
{
    "message": "string"
}
```

#### 6. 批量更新站点分类
```
POST /api/sites/batch-update-category

请求体：
{
    "site_ids": ["number"],     // 必填，站点ID数组
    "category_id": "number",    // 必填，目标分类ID
    "port": "number",          // 可选，要更新的端口号
    "update_port_enabled": "boolean" // 可选，是否启用端口更新
}

响应示例：
{
    "message": "string"
}
```

#### 7. 批量更新站点端口
```
POST /api/sites/update-ports

请求体：
{
    "port": "number"  // 必填，要更新的端口号（0-65535之间的整数）
}

响应示例：
{
    "code": "number",
    "message": "string",
    "updated_categories": ["number"]  // 更新了哪些分类下的网站
}
```

#### 8. 获取站点重定向信息
```
GET /api/redirect?id=:id

响应示例：
{
    "success": "boolean",
    "data": {
        "id": "number",
        "url": "string",
        "backup_url": "string",
        "internal_url": "string",
        "logo": "string",
        "title": "string",
        "desc": "string"
    }
}
```

### 注意事项：

1. 所有需要管理员权限的接口都需要在请求头中携带 `Authorization: Bearer <token>`
2. 所有请求和响应的 Content-Type 都是 `application/json`
3. URL 字段必须是有效的 URL 格式
4. 端口号必须在 0-65535 之间
5. 批量操作时，如果部分操作失败，会返回详细的错误信息
6. 更新操作会返回 404 错误如果目标站点不存在
7. 删除操作会返回 404 错误如果目标站点不存在