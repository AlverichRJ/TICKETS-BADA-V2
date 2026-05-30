SET @schema_name = DATABASE();

SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE digital_services ADD COLUMN digital_service_category enum(''ai'',''editing'',''hosting'',''security'',''productivity'',''business'',''design'',''other'') NOT NULL DEFAULT ''other'' AFTER normalized_name',
  'SELECT "digital_services.digital_service_category exists"')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'digital_services' AND COLUMN_NAME = 'digital_service_category');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 1,
  'UPDATE digital_services SET digital_service_category = category WHERE category IS NOT NULL',
  'SELECT "digital_services.category source column not found"')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'digital_services' AND COLUMN_NAME = 'category');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE payment_methods ADD COLUMN payment_method_type enum(''card'',''cash'',''transfer'',''account'',''other'') NOT NULL DEFAULT ''other'' AFTER name',
  'SELECT "payment_methods.payment_method_type exists"')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'payment_methods' AND COLUMN_NAME = 'payment_method_type');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 1,
  'UPDATE payment_methods SET payment_method_type = type WHERE type IS NOT NULL',
  'SELECT "payment_methods.type source column not found"')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'payment_methods' AND COLUMN_NAME = 'type');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE digital_service_subscriptions ADD COLUMN digital_service_billing_cycle enum(''monthly'',''quarterly'',''annual'',''one_time'') NOT NULL DEFAULT ''monthly'' AFTER responsible_name',
  'SELECT "digital_service_subscriptions.digital_service_billing_cycle exists"')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'digital_service_subscriptions' AND COLUMN_NAME = 'digital_service_billing_cycle');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 1,
  'UPDATE digital_service_subscriptions SET digital_service_billing_cycle = billing_cycle WHERE billing_cycle IS NOT NULL',
  'SELECT "digital_service_subscriptions.billing_cycle source column not found"')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'digital_service_subscriptions' AND COLUMN_NAME = 'billing_cycle');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE digital_service_subscriptions ADD COLUMN digital_service_status enum(''active'',''paused'',''cancelled'',''expired'') NOT NULL DEFAULT ''active'' AFTER renewal_day',
  'SELECT "digital_service_subscriptions.digital_service_status exists"')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'digital_service_subscriptions' AND COLUMN_NAME = 'digital_service_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 1,
  'UPDATE digital_service_subscriptions SET digital_service_status = status WHERE status IS NOT NULL',
  'SELECT "digital_service_subscriptions.status source column not found"')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'digital_service_subscriptions' AND COLUMN_NAME = 'status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE digital_service_subscriptions ADD COLUMN digital_service_priority enum(''high'',''medium'',''low'') NOT NULL DEFAULT ''medium'' AFTER digital_service_status',
  'SELECT "digital_service_subscriptions.digital_service_priority exists"')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'digital_service_subscriptions' AND COLUMN_NAME = 'digital_service_priority');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 1,
  'UPDATE digital_service_subscriptions SET digital_service_priority = priority WHERE priority IS NOT NULL',
  'SELECT "digital_service_subscriptions.priority source column not found"')
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'digital_service_subscriptions' AND COLUMN_NAME = 'priority');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
