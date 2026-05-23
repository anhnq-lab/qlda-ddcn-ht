
import * as fs from 'fs';
const text = fs.readFileSync('features/employees/services/employeeService.ts', 'utf8');
console.log(text.substring(0, 500));

