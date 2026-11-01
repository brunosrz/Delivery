CREATE TABLE `mkit_calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`date` text NOT NULL,
	`name` text NOT NULL,
	`recurring` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mkit_calendar_restaurant_idx` ON `mkit_calendar_events` (`restaurant_id`,`date`);--> statement-breakpoint
CREATE TABLE `mkit_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text,
	`name` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mkit_categories_restaurant_idx` ON `mkit_categories` (`restaurant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `mkit_categories_name_unique` ON `mkit_categories` (`restaurant_id`,`name`);--> statement-breakpoint
ALTER TABLE `mkit_materials` ADD `medium` text DEFAULT 'digital' NOT NULL;--> statement-breakpoint
ALTER TABLE `mkit_materials` ADD `category_id` text;--> statement-breakpoint
ALTER TABLE `mkit_materials` ADD `deleted_at` text;--> statement-breakpoint
INSERT INTO `mkit_categories` (`id`, `restaurant_id`, `name`) VALUES ('cat_redes_sociais', NULL, 'Redes sociais'), ('cat_promocoes', NULL, 'Promoções'), ('cat_datas_comemorativas', NULL, 'Datas comemorativas'), ('cat_cardapio', NULL, 'Cardápio e novidades'), ('cat_institucional', NULL, 'Institucional');
