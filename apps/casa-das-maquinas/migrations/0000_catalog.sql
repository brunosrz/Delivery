CREATE TABLE `addon_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`min_selections` integer DEFAULT 0 NOT NULL,
	`max_selections` integer DEFAULT 1 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "addon_groups_selection_range" CHECK("addon_groups"."min_selections" >= 0 and "addon_groups"."max_selections" >= 1 and "addon_groups"."min_selections" <= "addon_groups"."max_selections")
);
--> statement-breakpoint
CREATE INDEX `addon_groups_product_idx` ON `addon_groups` (`product_id`,`position`);--> statement-breakpoint
CREATE TABLE `addon_options` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`group_id` text NOT NULL,
	`name` text NOT NULL,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `addon_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "addon_options_price_non_negative" CHECK("addon_options"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `addon_options_group_idx` ON `addon_options` (`group_id`,`position`);--> statement-breakpoint
CREATE TABLE `menu_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `menu_sections_restaurant_idx` ON `menu_sections` (`restaurant_id`,`position`);--> statement-breakpoint
CREATE TABLE `opening_hours` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`weekday` integer NOT NULL,
	`opens_at` integer NOT NULL,
	`closes_at` integer NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "opening_hours_weekday_range" CHECK("opening_hours"."weekday" between 0 and 6),
	CONSTRAINT "opening_hours_window" CHECK("opening_hours"."opens_at" >= 0 and "opening_hours"."closes_at" <= 1440 and "opening_hours"."opens_at" < "opening_hours"."closes_at")
);
--> statement-breakpoint
CREATE INDEX `opening_hours_restaurant_idx` ON `opening_hours` (`restaurant_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`section_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`image_url` text,
	`price_cents` integer NOT NULL,
	`original_price_cents` integer,
	`available` integer DEFAULT true NOT NULL,
	`max_quantity` integer DEFAULT 10 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `menu_sections`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "products_price_non_negative" CHECK("products"."price_cents" >= 0),
	CONSTRAINT "products_max_quantity_range" CHECK("products"."max_quantity" between 1 and 99)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_restaurant_slug_unique` ON `products` (`restaurant_id`,`slug`);--> statement-breakpoint
CREATE INDEX `products_section_idx` ON `products` (`section_id`,`position`);--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`logo_url` text,
	`cover_url` text,
	`timezone` text DEFAULT 'America/Sao_Paulo' NOT NULL,
	`is_open` integer DEFAULT true NOT NULL,
	`delivery_enabled` integer DEFAULT true NOT NULL,
	`pickup_enabled` integer DEFAULT true NOT NULL,
	`delivery_fee_cents` integer DEFAULT 0 NOT NULL,
	`minimum_order_cents` integer DEFAULT 0 NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "restaurants_delivery_fee_non_negative" CHECK("restaurants"."delivery_fee_cents" >= 0),
	CONSTRAINT "restaurants_minimum_order_non_negative" CHECK("restaurants"."minimum_order_cents" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `restaurants_slug_unique` ON `restaurants` (`slug`);
