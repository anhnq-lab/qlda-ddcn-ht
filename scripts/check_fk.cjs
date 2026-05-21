const { Client } = require('pg');
require('dotenv').config();

const client = new Client(process.env.DATABASE_URL);
client.connect()
  .then(() => client.query("SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'task_comments' AND c.conname = 'task_comments_task_id_fkey'"))
  .then(res => { console.log(res.rows); client.end() })
  .catch(console.error);
