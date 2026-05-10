import json
import uuid

data = json.load(open('d:/01_Projects/qlda-ddcn-ht/ks/extracted_tasks.json', encoding='utf-8'))

sql = []

for dept in data:
    dept_name = dept['name']
    dept_code = dept_name # Just use name as code for now
    plan_id = str(uuid.uuid4())
    
    # insert monthly plan
    sql.append(f"""
INSERT INTO public.monthly_plans (id, plan_month, plan_year, department_code, department_name, status, created_at, updated_at) 
VALUES ('{plan_id}', 5, 2026, '{dept_code}', '{dept_name}', 'published', now(), now());
""")

    for i, task in enumerate(dept['tasks']):
        item_id = str(uuid.uuid4())
        task_name = task.get('title', '').replace("'", "''")
        assignee = task.get('assignee', '').replace("'", "''")
        manager = task.get('manager', '').replace("'", "''")
        director = task.get('director', '').replace("'", "''")
        deadline = task.get('deadline', '').replace("'", "''")
        
        # Only insert if task_name is not empty
        if task_name.strip():
            sql.append(f"""
INSERT INTO public.monthly_plan_items (id, monthly_plan_id, task_name, staff_name, dept_head_name, ban_head_name, deadline_note, sort_order, status, created_at, updated_at)
VALUES ('{item_id}', '{plan_id}', '{task_name}', '{assignee}', '{manager}', '{director}', '{deadline}', {i}, 'planned', now(), now());
""")

with open('d:/01_Projects/qlda-ddcn-ht/ks/import.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql))
