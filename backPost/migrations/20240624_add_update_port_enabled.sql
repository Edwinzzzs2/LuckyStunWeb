-- 为 sites 表添加 update_port_enabled 字段
ALTER TABLE sites 
ADD COLUMN update_port_enabled BOOLEAN DEFAULT TRUE;
 
-- 为已存在的记录设置默认值
UPDATE sites 
SET update_port_enabled = TRUE 
WHERE update_port_enabled IS NULL; 