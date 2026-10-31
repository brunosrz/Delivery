CREATE TABLE `asaas_customers` (
	`user_id` text PRIMARY KEY NOT NULL,
	`asaas_customer_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payment_charges` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`restaurant_id` text NOT NULL,
	`provider` text DEFAULT 'asaas' NOT NULL,
	`provider_charge_id` text NOT NULL,
	`billing_type` text NOT NULL,
	`invoice_url` text,
	`pix_payload` text,
	`pix_qr_image` text,
	`pix_expires_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_charges_order_unique` ON `payment_charges` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_charges_provider_charge_unique` ON `payment_charges` (`provider`,`provider_charge_id`);--> statement-breakpoint
CREATE TABLE `payment_webhook_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`provider_charge_id` text,
	`received_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
