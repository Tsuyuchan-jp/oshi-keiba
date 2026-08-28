-- 出走馬の育成ウマ娘・衣装 ID。既存行は NULL のまま扱う。
ALTER TABLE horses ADD COLUMN chara_id INTEGER;
ALTER TABLE horses ADD COLUMN dress_id INTEGER;
