import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import z from 'zod';
import { zValidator } from '@hono/zod-validator';
// env 环境变量来自
const app = new Hono<{ Bindings: Env }>();
const modelValidator = zValidator(
	'param',
	z.object({
		model: z.enum(['users', 'posts', 'todos', 'albums', 'photos', 'comments']),
	})
);
const queryValidator = zValidator(
	'query',
	z.object({
		page: z
			.number({
				invalid_type_error: 'page must be a number',
			})
			.gt(1)
			.optional(),
		limit: z
			.number({
				invalid_type_error: 'limit must be a number',
			})
			.gt(1)
			.optional(),
	})
);
app.get('/:model', modelValidator, queryValidator, async (c) => {
	const { model } = c.req.valid('param');
	const { page = 1, limit = 10 } = c.req.valid('query');
	const result = await c.env.DB.prepare(`SELECT * FROM ${model} ORDER BY id ASC LIMIT ? OFFSET ?;`)
		.bind(model, limit, (page - 1) * limit)
		.run();
	return c.json(result.results);
});
export default app;
