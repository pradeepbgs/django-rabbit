CREATE TABLE `request_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`method` text NOT NULL,
	`path` text NOT NULL,
	`headers` text NOT NULL,
	`body` text,
	`response_status` integer NOT NULL,
	`response_body` text,
	`timestamp` text NOT NULL
);
