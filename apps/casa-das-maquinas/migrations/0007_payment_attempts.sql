CREATE TABLE `payment_attempts` (
	`order_id` text PRIMARY KEY NOT NULL,
	`state` text DEFAULT 'not_created' NOT NULL,
	`lease_expires_at` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
