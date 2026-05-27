ALTER TABLE `devices` ADD COLUMN `assigned_user_name` varchar(180);
--> statement-breakpoint
ALTER TABLE `devices` ADD COLUMN `assigned_user_email` varchar(220);
--> statement-breakpoint
ALTER TABLE `devices` ADD COLUMN `team` varchar(160);
--> statement-breakpoint
ALTER TABLE `devices` ADD COLUMN `external_responsiva_url` varchar(700);
--> statement-breakpoint
CREATE TABLE `responsivas` (
	`id` varchar(32) NOT NULL,
	`device_id` varchar(32) NOT NULL,
	`responsible_user_id` varchar(32),
	`responsible_name` varchar(180) NOT NULL,
	`responsible_email` varchar(220),
	`department_id` varchar(32),
	`responsiva_status` enum('active','returned','cancelled') NOT NULL DEFAULT 'active',
	`notes` text,
	`created_by_id` varchar(32),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `responsivas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `responsivas_device_id_idx` ON `responsivas` (`device_id`);
--> statement-breakpoint
CREATE INDEX `responsivas_responsible_user_id_idx` ON `responsivas` (`responsible_user_id`);
--> statement-breakpoint
CREATE INDEX `responsivas_status_idx` ON `responsivas` (`responsiva_status`);
