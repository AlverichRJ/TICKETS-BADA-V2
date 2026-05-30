CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` varchar(32) NOT NULL,
  `name` varchar(180) NOT NULL,
  `type` enum('card','cash','transfer','account','other') NOT NULL DEFAULT 'other',
  `owner_name` varchar(180),
  `last_four` varchar(8),
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `payment_methods_id` PRIMARY KEY (`id`),
  CONSTRAINT `payment_methods_name_idx` UNIQUE (`name`)
);

CREATE INDEX `payment_methods_active_idx` ON `payment_methods` (`is_active`);

CREATE TABLE IF NOT EXISTS `digital_services` (
  `id` varchar(32) NOT NULL,
  `name` varchar(180) NOT NULL,
  `normalized_name` varchar(180) NOT NULL,
  `category` enum('ai','editing','hosting','security','productivity','business','design','other') NOT NULL DEFAULT 'other',
  `provider` varchar(180),
  `website_url` varchar(700),
  `description` text,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `digital_services_id` PRIMARY KEY (`id`),
  CONSTRAINT `digital_services_normalized_name_idx` UNIQUE (`normalized_name`)
);

CREATE INDEX `digital_services_category_idx` ON `digital_services` (`category`);
CREATE INDEX `digital_services_active_idx` ON `digital_services` (`is_active`);

CREATE TABLE IF NOT EXISTS `digital_service_subscriptions` (
  `id` varchar(32) NOT NULL,
  `service_id` varchar(32) NOT NULL,
  `department_id` varchar(32),
  `responsible_user_id` varchar(32),
  `responsible_name` varchar(180),
  `billing_cycle` enum('monthly','quarterly','annual','one_time') NOT NULL DEFAULT 'monthly',
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(8) NOT NULL DEFAULT 'MXN',
  `payment_method_id` varchar(32),
  `purchase_date` date,
  `renewal_date` date,
  `renewal_day` int,
  `status` enum('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
  `priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
  `usage_description` text,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `digital_service_subscriptions_id` PRIMARY KEY (`id`)
);

CREATE INDEX `digital_subscriptions_service_id_idx` ON `digital_service_subscriptions` (`service_id`);
CREATE INDEX `digital_subscriptions_department_id_idx` ON `digital_service_subscriptions` (`department_id`);
CREATE INDEX `digital_subscriptions_responsible_user_id_idx` ON `digital_service_subscriptions` (`responsible_user_id`);
CREATE INDEX `digital_subscriptions_payment_method_id_idx` ON `digital_service_subscriptions` (`payment_method_id`);
CREATE INDEX `digital_subscriptions_status_idx` ON `digital_service_subscriptions` (`status`);
CREATE INDEX `digital_subscriptions_renewal_date_idx` ON `digital_service_subscriptions` (`renewal_date`);
