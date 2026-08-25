-- カレント開催。既存は最新の1本をカレントにする

ALTER TABLE events ADD COLUMN is_current INTEGER NOT NULL DEFAULT 0;

UPDATE events
SET is_current = 1
WHERE id = (SELECT id FROM events ORDER BY created_at DESC LIMIT 1);
