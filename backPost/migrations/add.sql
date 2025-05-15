-- -- 为 sites 表添加 update_port_enabled 字段
-- ALTER TABLE sites 
-- ADD COLUMN update_port_enabled BOOLEAN DEFAULT TRUE;
 
-- -- 为已存在的记录设置默认值
-- UPDATE sites 
-- SET update_port_enabled = TRUE 
-- WHERE update_port_enabled IS NULL; 

ALTER TABLE sites 
ADD COLUMN backup_url VARCHAR(255) NULL AFTER url,
ADD COLUMN internal_url VARCHAR(255) NULL AFTER backup_url;

-- 为已存在的记录设置初始值（如果需要的话）
UPDATE sites 
SET backup_url = NULL, 
    internal_url = NULL 
WHERE backup_url IS NULL AND internal_url IS NULL;