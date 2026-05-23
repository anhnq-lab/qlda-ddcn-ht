CREATE OR REPLACE FUNCTION get_task_comments_v2(p_task_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'task_id', c.task_id,
        'user_id', c.user_id,
        'content', c.content,
        'attachments', c.attachments,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'user', jsonb_build_object(
          'id', u.id,
          'email', u.email,
          'raw_user_meta_data', u.raw_user_meta_data
        )
      ) ORDER BY c.created_at ASC
    )
    FROM public.task_comments c
    JOIN auth.users u ON c.user_id = u.id
    WHERE c.task_id = p_task_id),
    '[]'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_task_activities_v2(p_task_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'task_id', a.task_id,
        'user_id', a.user_id,
        'action_type', a.action_type,
        'old_value', a.old_value,
        'new_value', a.new_value,
        'created_at', a.created_at,
        'user', CASE WHEN u.id IS NOT NULL THEN jsonb_build_object(
          'id', u.id,
          'email', u.email,
          'raw_user_meta_data', u.raw_user_meta_data
        ) ELSE NULL END
      ) ORDER BY a.created_at DESC
    )
    FROM public.task_activities a
    LEFT JOIN auth.users u ON a.user_id = u.id
    WHERE a.task_id = p_task_id),
    '[]'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
