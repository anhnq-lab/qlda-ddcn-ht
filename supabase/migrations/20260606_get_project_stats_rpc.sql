-- RPC: get_project_stats — server-side faceted counting for project list filters
-- Replaces client-side counting in ProjectService.getStats() which fetches all rows
CREATE OR REPLACE FUNCTION get_project_stats(
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_current_status TEXT DEFAULT NULL,
    p_group TEXT DEFAULT NULL,
    p_board TEXT DEFAULT NULL,
    p_specialty TEXT DEFAULT NULL,
    p_stage TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH filtered AS (
        SELECT status, current_status_code, group_code, management_board, specialty_type
        FROM projects
        WHERE ($1 IS NULL OR $1 = '' OR
               project_name ILIKE '%' || $1 || '%' OR
               project_id ILIKE '%' || $1 || '%' OR
               investor_name ILIKE '%' || $1 || '%')
          AND ($7 IS NULL OR $7 = '' OR stage = $7)
    )
    SELECT json_build_object(
        'status_counts', COALESCE((
            SELECT json_object_agg(status, cnt) FROM (
                SELECT status::text, COUNT(*) AS cnt FROM filtered
                WHERE ($4 IS NULL OR $4 = '' OR group_code = $4)
                  AND ($5 IS NULL OR $5 = '' OR management_board::text = $5)
                  AND ($6 IS NULL OR $6 = '' OR specialty_type = $6)
                GROUP BY status
            ) t
        ), '{}'::json),
        'current_status_counts', COALESCE((
            SELECT json_object_agg(cs, cnt) FROM (
                SELECT current_status_code::text AS cs, COUNT(*) AS cnt FROM filtered
                WHERE current_status_code IS NOT NULL
                  AND ($4 IS NULL OR $4 = '' OR group_code = $4)
                  AND ($5 IS NULL OR $5 = '' OR management_board::text = $5)
                  AND ($6 IS NULL OR $6 = '' OR specialty_type = $6)
                GROUP BY current_status_code
            ) t
        ), '{}'::json),
        'group_counts', COALESCE((
            SELECT json_object_agg(group_code, cnt) FROM (
                SELECT group_code, COUNT(*) AS cnt FROM filtered
                WHERE group_code IS NOT NULL
                  AND ($2 IS NULL OR $2 = '' OR status::text = $2)
                  AND ($3 IS NULL OR $3 = '' OR current_status_code::text = $3)
                  AND ($5 IS NULL OR $5 = '' OR management_board::text = $5)
                  AND ($6 IS NULL OR $6 = '' OR specialty_type = $6)
                GROUP BY group_code
            ) t
        ), '{}'::json),
        'board_counts', COALESCE((
            SELECT json_object_agg(board, cnt) FROM (
                SELECT management_board::text AS board, COUNT(*) AS cnt FROM filtered
                WHERE management_board IS NOT NULL
                  AND ($2 IS NULL OR $2 = '' OR status::text = $2)
                  AND ($3 IS NULL OR $3 = '' OR current_status_code::text = $3)
                  AND ($4 IS NULL OR $4 = '' OR group_code = $4)
                  AND ($6 IS NULL OR $6 = '' OR specialty_type = $6)
                GROUP BY management_board
            ) t
        ), '{}'::json),
        'specialty_counts', COALESCE((
            SELECT json_object_agg(specialty_type, cnt) FROM (
                SELECT specialty_type, COUNT(*) AS cnt FROM filtered
                WHERE specialty_type IS NOT NULL
                  AND ($2 IS NULL OR $2 = '' OR status::text = $2)
                  AND ($3 IS NULL OR $3 = '' OR current_status_code::text = $3)
                  AND ($4 IS NULL OR $4 = '' OR group_code = $4)
                  AND ($5 IS NULL OR $5 = '' OR management_board::text = $5)
                GROUP BY specialty_type
            ) t
        ), '{}'::json),
        'total', (
            SELECT COUNT(*) FROM filtered
            WHERE ($2 IS NULL OR $2 = '' OR status::text = $2)
              AND ($3 IS NULL OR $3 = '' OR current_status_code::text = $3)
              AND ($4 IS NULL OR $4 = '' OR group_code = $4)
              AND ($5 IS NULL OR $5 = '' OR management_board::text = $5)
              AND ($6 IS NULL OR $6 = '' OR specialty_type = $6)
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
