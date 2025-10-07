import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import uploadRoutes from './controller/singned_url.js'
import { cors } from 'hono/cors'
import 'dotenv/config';

const app = new Hono()

app.use(
  cors({
    origin: "http://127.0.0.1:5500",
  })
);

app.route('api/v1/upload', uploadRoutes)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})