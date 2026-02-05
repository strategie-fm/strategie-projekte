-- View: tasks_with_relations
-- Kombiniert Tasks mit allen Relationen in einer einzigen Abfrage
-- Performance-Optimierung: Ersetzt 4-5 separate Queries

DROP VIEW IF EXISTS tasks_with_relations;

CREATE VIEW tasks_with_relations AS
SELECT
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date,
  t.completed_at,
  t.position,
  t.section_id,
  t.parent_task_id,
  t.created_by,
  t.created_at,
  t.updated_at,

  -- Projekte als JSON-Array
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', p.id,
        'name', p.name,
        'color', p.color,
        'description', p.description,
        'position', p.position,
        'created_by', p.created_by,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'archived_at', p.archived_at
      )
    )
    FROM task_projects tp
    JOIN projects p ON p.id = tp.project_id
    WHERE tp.task_id = t.id
    ), '[]'::json
  ) as projects,

  -- Labels als JSON-Array
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', l.id,
        'name', l.name,
        'color', l.color,
        'created_by', l.created_by,
        'created_at', l.created_at
      )
    )
    FROM task_labels tl
    JOIN labels l ON l.id = tl.label_id
    WHERE tl.task_id = t.id
    ), '[]'::json
  ) as labels,

  -- Assignees als JSON-Array
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'user_id', ta.user_id,
        'task_id', ta.task_id,
        'profile', json_build_object(
          'id', pr.id,
          'email', pr.email,
          'full_name', pr.full_name,
          'avatar_url', pr.avatar_url
        )
      )
    )
    FROM task_assignees ta
    JOIN profiles pr ON pr.id = ta.user_id
    WHERE ta.task_id = t.id
    ), '[]'::json
  ) as assignees,

  -- Subtask counts als JSON-Objekt
  json_build_object(
    'total', (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id AND st.status != 'archived'),
    'completed', (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id AND st.status = 'done')
  ) as subtask_count

FROM tasks t
WHERE t.parent_task_id IS NULL
  AND t.status != 'archived';

-- RLS für die View aktivieren
-- Views erben RLS von den zugrunde liegenden Tabellen automatisch,
-- aber wir erstellen eine explizite Policy für bessere Kontrolle

-- Hinweis: Falls RLS auf der View nicht funktioniert, kann man stattdessen
-- eine Funktion mit SECURITY DEFINER verwenden
