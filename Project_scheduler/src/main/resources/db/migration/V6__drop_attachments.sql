-- V6: Drop the attachments table and its index (S3 attachment module removed)
DROP INDEX IF EXISTS idx_attachment_work_item;
DROP TABLE IF EXISTS attachments;
