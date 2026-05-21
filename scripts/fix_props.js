const fs = require('fs');
let c = fs.readFileSync('features/tasks/components/TaskTableView.tsx', 'utf8');
c = c.replace(/actionLabel="Tạo công việc"\r?\n\s*onAction=\{openCreateModal\}/, 'action={{ label: "Tạo công việc", onClick: openCreateModal }}');
fs.writeFileSync('features/tasks/components/TaskTableView.tsx', c);
