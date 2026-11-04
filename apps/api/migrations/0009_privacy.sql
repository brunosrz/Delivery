CREATE TABLE `consent_records` (
	`id` text PRIMARY KEY NOT NULL,
	`consent_id` text NOT NULL,
	`user_id` text,
	`version` integer NOT NULL,
	`analytics` integer NOT NULL,
	`marketing` integer NOT NULL,
	`source` text NOT NULL,
	`locale` text NOT NULL,
	`ip_hash` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `consent_records_consent_idx` ON `consent_records` (`consent_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `consent_records_user_idx` ON `consent_records` (`user_id`);--> statement-breakpoint
CREATE INDEX `consent_records_created_idx` ON `consent_records` (`created_at`);--> statement-breakpoint
CREATE TABLE `data_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_hash` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`reason` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `data_requests_subject_idx` ON `data_requests` (`subject_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `legal_acceptances` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`document` text NOT NULL,
	`version` text NOT NULL,
	`ip_hash` text,
	`accepted_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `legal_acceptances_unique` ON `legal_acceptances` (`user_id`,`document`,`version`);