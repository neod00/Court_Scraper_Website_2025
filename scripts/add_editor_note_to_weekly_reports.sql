-- ============================================================================
-- 주간 데이터 칼럼: weekly_reports에 사람이 쓴 해석(editor_note) 컬럼 추가
-- 실행 위치: Supabase 대시보드 > SQL Editor
--
-- 배경:
--   weekly_reports는 지금까지 자동 집계 수치만 담고 있었습니다.
--   여기에 편집자가 직접 쓴 해석을 붙여 "주간 데이터 칼럼"으로 발행합니다.
--
-- 색인 규칙 (코드와 동기화):
--   editor_note가 있는 주차만 개별 URL(/trend/{week_start})로 색인·사이트맵 등록.
--   해석이 없는 주차는 자동 집계로만 남고 색인되지 않습니다.
--   => 사람의 해석이 곧 품질 게이트입니다.
-- ============================================================================

-- 1) 컬럼 추가 (이미 있으면 무시)
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS editor_note TEXT;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS editor_note_title TEXT;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS editor_note_by TEXT;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS editor_note_at TIMESTAMPTZ;

COMMENT ON COLUMN weekly_reports.editor_note IS '편집자가 직접 작성한 주간 해석. 줄바꿈 두 번으로 문단 구분. 이 값이 있어야 해당 주차가 색인됩니다.';
COMMENT ON COLUMN weekly_reports.editor_note_title IS '칼럼 제목. 비우면 기본 제목(N월 N주차 매각 공고 리뷰)이 사용됩니다.';
COMMENT ON COLUMN weekly_reports.editor_note_by IS '작성자 표기 (예: 김달 · 로옥션 편집팀)';
COMMENT ON COLUMN weekly_reports.editor_note_at IS '해석 작성/최종 수정 시각. 발행일로 사용됩니다.';

-- 2) 색인 대상(해석이 달린 주차) 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_weekly_reports_editor_note
    ON weekly_reports(week_start DESC)
    WHERE editor_note IS NOT NULL;

-- 3) 확인
SELECT week_start, week_end, total_notices,
       (editor_note IS NOT NULL) AS has_editor_note
FROM weekly_reports
ORDER BY week_end DESC
LIMIT 20;
