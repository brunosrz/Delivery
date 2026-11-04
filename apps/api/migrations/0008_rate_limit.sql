CREATE TABLE `rate_limit_buckets` (
	`key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`key`, `window_start`)
);
--> statement-breakpoint
CREATE INDEX `rate_limit_window_idx` ON `rate_limit_buckets` (`window_start`);