-- Migration script to add rejection reason and admin tracking to bank transfer tables
ALTER TABLE awash_bank_payments ADD COLUMN rejection_reason TEXT NULL, ADD COLUMN admin_id INT NULL;
ALTER TABLE cbe_bank_payments ADD COLUMN rejection_reason TEXT NULL, ADD COLUMN admin_id INT NULL;
ALTER TABLE birhan_bank_payments ADD COLUMN rejection_reason TEXT NULL, ADD COLUMN admin_id INT NULL;

-- Add foreign key constraints if Users table exists and matches
ALTER TABLE awash_bank_payments ADD CONSTRAINT fk_awash_admin FOREIGN KEY (admin_id) REFERENCES Users(user_id);
ALTER TABLE cbe_bank_payments ADD CONSTRAINT fk_cbe_admin FOREIGN KEY (admin_id) REFERENCES Users(user_id);
ALTER TABLE birhan_bank_payments ADD CONSTRAINT fk_birhan_admin FOREIGN KEY (admin_id) REFERENCES Users(user_id);
