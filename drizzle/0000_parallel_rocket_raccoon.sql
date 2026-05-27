CREATE TABLE `computer_equipment` (
	`id` varchar(32) NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `computer_equipment_id` PRIMARY KEY(`id`),
	CONSTRAINT `computer_equipment_name_idx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` varchar(32) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_name_idx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `device_delivery_history` (
	`id` varchar(32) NOT NULL,
	`device_id` varchar(32) NOT NULL,
	`delivered_by_id` varchar(32),
	`previous_assigned_user_id` varchar(32),
	`previous_assigned_user_name` varchar(180) NOT NULL,
	`previous_assigned_user_email` varchar(220),
	`previous_department_id` varchar(32),
	`previous_department_name` varchar(180),
	`previous_computer_equipment_id` varchar(32),
	`previous_computer_equipment_name` varchar(180),
	`equipment` varchar(180) NOT NULL,
	`serial_number` varchar(180) NOT NULL,
	`device_state` enum('available','assigned','maintenance','retired') NOT NULL DEFAULT 'available',
	`description` text,
	`notes` text,
	`delivered_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `device_delivery_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` varchar(32) NOT NULL,
	`assigned_user_id` varchar(32),
	`assigned_computer_equipment_id` varchar(32),
	`department_id` varchar(32),
	`equipment` varchar(180) NOT NULL,
	`serial_number` varchar(180) NOT NULL,
	`device_state` enum('available','assigned','maintenance','retired') NOT NULL DEFAULT 'available',
	`description` text,
	`loan_status` enum('active','returned') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_serial_number_idx` UNIQUE(`serial_number`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` varchar(32) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`stored_name` varchar(255) NOT NULL,
	`mime_type` varchar(120) NOT NULL,
	`size_bytes` int NOT NULL,
	`path` varchar(700) NOT NULL,
	`file_type` enum('responsiva','ine','other') NOT NULL DEFAULT 'other',
	`user_id` varchar(32),
	`device_id` varchar(32),
	`uploaded_by_id` varchar(32),
	`uploaded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `files_id` PRIMARY KEY(`id`),
	CONSTRAINT `files_stored_name_idx` UNIQUE(`stored_name`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int NOT NULL DEFAULT 1,
	`app_name` varchar(180) NOT NULL DEFAULT 'Tickets BADABUN',
	`logo_path` varchar(700),
	`logo_original_name` varchar(255),
	`logo_mime_type` varchar(120),
	`updated_by_id` varchar(32),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_audits` (
	`id` varchar(32) NOT NULL,
	`ticket_id` varchar(32) NOT NULL,
	`actor_id` varchar(32),
	`audit_action` enum('created','updated','status_changed','assigned','closed','file_attached') NOT NULL,
	`ticket_status` enum('pending','in_progress','resolved') NOT NULL DEFAULT 'pending',
	`notes` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_sequences` (
	`id` int NOT NULL DEFAULT 1,
	`value` int NOT NULL DEFAULT 0,
	CONSTRAINT `ticket_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` varchar(32) NOT NULL,
	`public_id` varchar(24) NOT NULL,
	`creator_id` varchar(32) NOT NULL,
	`leader_id` varchar(32),
	`leader_name` varchar(180),
	`device_id` varchar(32),
	`reviewed_equipment` varchar(220),
	`failure_description` text NOT NULL,
	`device_specs` text,
	`reported_at` timestamp NOT NULL DEFAULT (now()),
	`ticket_priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`ticket_status` enum('pending','in_progress','resolved') NOT NULL DEFAULT 'pending',
	`resolved_at` timestamp,
	`technical_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_public_id_idx` UNIQUE(`public_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(32) NOT NULL,
	`name` varchar(180) NOT NULL,
	`email` varchar(220) NOT NULL,
	`google_id` varchar(128),
	`role` enum('admin','user') NOT NULL DEFAULT 'user',
	`avatar_url` varchar(600),
	`is_active` boolean NOT NULL DEFAULT true,
	`last_login_at` timestamp,
	`login_count` int NOT NULL DEFAULT 0,
	`department_id` varchar(32),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_idx` UNIQUE(`email`),
	CONSTRAINT `users_google_id_idx` UNIQUE(`google_id`)
);
--> statement-breakpoint
CREATE INDEX `delivery_device_id_idx` ON `device_delivery_history` (`device_id`);--> statement-breakpoint
CREATE INDEX `delivery_delivered_by_id_idx` ON `device_delivery_history` (`delivered_by_id`);--> statement-breakpoint
CREATE INDEX `delivery_delivered_at_idx` ON `device_delivery_history` (`delivered_at`);--> statement-breakpoint
CREATE INDEX `devices_assigned_user_id_idx` ON `devices` (`assigned_user_id`);--> statement-breakpoint
CREATE INDEX `devices_equipment_id_idx` ON `devices` (`assigned_computer_equipment_id`);--> statement-breakpoint
CREATE INDEX `devices_department_id_idx` ON `devices` (`department_id`);--> statement-breakpoint
CREATE INDEX `files_user_id_idx` ON `files` (`user_id`);--> statement-breakpoint
CREATE INDEX `files_device_id_idx` ON `files` (`device_id`);--> statement-breakpoint
CREATE INDEX `ticket_audits_ticket_id_idx` ON `ticket_audits` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `ticket_audits_actor_id_idx` ON `ticket_audits` (`actor_id`);--> statement-breakpoint
CREATE INDEX `tickets_creator_id_idx` ON `tickets` (`creator_id`);--> statement-breakpoint
CREATE INDEX `tickets_leader_id_idx` ON `tickets` (`leader_id`);--> statement-breakpoint
CREATE INDEX `tickets_device_id_idx` ON `tickets` (`device_id`);--> statement-breakpoint
CREATE INDEX `tickets_status_idx` ON `tickets` (`ticket_status`);--> statement-breakpoint
CREATE INDEX `tickets_priority_idx` ON `tickets` (`ticket_priority`);--> statement-breakpoint
CREATE INDEX `users_department_id_idx` ON `users` (`department_id`);