CREATE TABLE `outbox_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text DEFAULT 'live.publish' NOT NULL,
	`restaurant_id` text NOT NULL,
	`order_id` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "outbox_jobs_attempts_non_negative" CHECK("outbox_jobs"."attempts" >= 0)
);
--> statement-breakpoint
CREATE INDEX `outbox_jobs_status_created_idx` ON `outbox_jobs` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `outbox_jobs_order_idx` ON `outbox_jobs` (`order_id`);