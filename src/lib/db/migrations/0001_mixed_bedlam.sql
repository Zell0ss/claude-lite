CREATE INDEX `idx_conv_updated` ON `conversations` (`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_messages_conv` ON `messages` (`conversation_id`,`created_at`);