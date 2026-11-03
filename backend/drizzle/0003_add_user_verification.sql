-- Migrasi idempoten: aman dijalankan ulang pada database yang sudah memiliki
-- sebagian/seluruh kolom. Semua akun lama otomatis menjadi ACTIVE.
DROP PROCEDURE IF EXISTS `__add_user_verification_columns`;--> statement-breakpoint
CREATE PROCEDURE `__add_user_verification_columns`()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'status'
    ) THEN
        ALTER TABLE `users`
            ADD `status` enum('ACTIVE','PENDING_VERIFICATION','REJECTED')
            NOT NULL DEFAULT 'ACTIVE';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'claim_nim'
    ) THEN
        ALTER TABLE `users` ADD `claim_nim` varchar(20);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'claim_program_studi'
    ) THEN
        ALTER TABLE `users` ADD `claim_program_studi` varchar(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'verified_by'
    ) THEN
        ALTER TABLE `users` ADD `verified_by` int;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'verified_at'
    ) THEN
        ALTER TABLE `users` ADD `verified_at` timestamp;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'reject_reason'
    ) THEN
        ALTER TABLE `users` ADD `reject_reason` varchar(500);
    END IF;
END;--> statement-breakpoint
CALL `__add_user_verification_columns`();--> statement-breakpoint
DROP PROCEDURE IF EXISTS `__add_user_verification_columns`;--> statement-breakpoint
UPDATE `users`
SET `status` = 'ACTIVE'
WHERE `status` IS NULL
   OR `status` NOT IN ('ACTIVE','PENDING_VERIFICATION','REJECTED');
