CREATE TABLE `mahasiswa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nim` varchar(20) NOT NULL,
	`program_studi` varchar(100) NOT NULL,
	`peminatan` varchar(100),
	CONSTRAINT `mahasiswa_id` PRIMARY KEY(`id`),
	CONSTRAINT `mahasiswa_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `mahasiswa_nim_unique` UNIQUE(`nim`)
);
--> statement-breakpoint
CREATE TABLE `skripsi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mahasiswa_id` int NOT NULL,
	`judul` varchar(255) NOT NULL,
	`abstrak` text,
	`tahun` int NOT NULL,
	`file_url` varchar(500),
	`status` enum('draft','diajukan','disetujui','ditolak') NOT NULL DEFAULT 'draft',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `skripsi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skripsi` ADD CONSTRAINT `skripsi_mahasiswa_id_mahasiswa_id_fk` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa`(`id`) ON DELETE cascade ON UPDATE no action;