# Asuna

A blazing-fast, progressive microservice framework.

> If you’re looking for a more feature-rich framework, consider Elysia (https://elysiajs.com).

Asuna is a microservice framework powered by Bun + itty-router that
provides a tidy, clear project structure to help you deliver services quickly.

The framework is recommended for light loading tasks.

## Prerequisites

Asuna requires `Bun >= 1.2`.

The framework is designed to work with the following storage and middleware:

- MySQL (mysql2/promise) - Persistent database, supports multiple clusters (`MYSQL_CLUSTERS`).
- Redis/Valkey (ioredis) - In-service cache storage (`REDIS_URL`).
- RabbitMQ (amqplib) - Message broker for inter-service communication (`AMPQ_URL`).

Note: Environment variable names follow the current implementation. The message broker uses `AMPQ_*` (intentional spelling per code).

## Get Started

Create a new project by using this repository as a template or cloning it.

```sh
bun install
```

Development (hot reload):

```sh
bun run dev
```

Production:

```sh
bun start
```

## System Architecture

For fast development, business logic routes can be written in the `src/routes` directory.
If you prefer to follow SOLID, create service classes under `src/services` and
wire them in routes (Asuna uses itty-router rather than Express).

Example, a service class:

```ts
// src/services/example.ts
export default class ExampleService {
	async getNow(): Promise<number> {
		return Date.now();
	}
}
```

Route mapping:

```ts
// src/routes/example.ts
import { Router } from 'itty-router';
import { rootRouter } from '../init/router';
import ExampleService from '../services/example';

const service = new ExampleService();
const router = Router({ base: '/example' });

router.get('/now', async () => {
	const now = await service.getNow();
	return new Response(JSON.stringify({ now }), {
		headers: { 'Content-Type': 'application/json' },
	});
});

export default () => {
	rootRouter.all('/example/*', router.fetch);
};
```

Asuna provides a flexible structure to create your service, with no strict rules imposed.

## Framework Structure

Primary project structure:

```plaintext
├── app.ts                 (entry point)
├── Dockerfile             (container deployment)
├── src
│   ├── execute.ts         (application executor: spin up workers)
│   ├── config.ts          (configuration reader)
│   ├── init               (initializers and composables)
│   │   ├── cache.ts       (Redis cache layer)
│   │   ├── const.ts       (constants and metadata)
│   │   ├── instance.ts    (instance/IPC message box)
│   │   ├── mysql.ts       (MySQL cluster layer)
│   │   ├── queue.ts       (RabbitMQ queue layer)
│   │   ├── router.ts      (root router and registration types)
│   │   └── worker.ts      (per-worker HTTP server)
│   └── routes             (application routes)
│       ├── root.ts
│       └── example.ts
└── README.md
```

## Configuration

Asuna reads configuration from `Bun.env`.

- Provide settings via system environment variables or a `.env` file (auto-loaded by Bun).
- Special value `_disabled_` is treated as an empty string.
- If a required key is missing, `get(key)` in `src/config.ts` will throw and stop startup.

Common environment variables (excerpt):

- Base
	- `NODE_ENV`: `production` or `development`.
	- `RUNTIME_ENV`, `INSTANCE_MODE`: optional environment descriptors.
	- `INSTANCE_URL`: canonical/base URL of this service (required).
- Cache (Redis/Valkey)
	- `REDIS_URL`: connection string (required).
	- `REDIS_NAMESPACE`: key prefix namespace.
- Database (MySQL, multi-cluster)
	- `MYSQL_CLUSTERS`: comma-separated connection URIs, e.g.
		`mysql://user:pass@host:3306/db,mysql://user:pass@host2:3306/db`.
- Message Queue (RabbitMQ)
	- `AMPQ_URL`: connection string (required).
	- `AMPQ_DURABLE`: `yes` for durable queues, anything else is false.

## Dependencies

Install packages:

```sh
bun install
```

## Development Environment

Hot-reload development:

```sh
bun run dev
```

## Production Environment

Start the service:

```sh
bun start
```

## API Documentation

If you don’t plan to use Swagger/OpenAPI yet, write API docs directly in `README.md`.

For example, a JSDoc-like OpenAPI snippet:

```js
/**
 * >openapi
 * /example/now:
 *   get:
 *     tags:
 *       - example
 *     summary: Get POSIX timestamp
 *     description: Example to show current POSIX timestamp.
 *     responses:
 *       200:
 *         description: Returns current POSIX timestamp.
 */
```

Can be rewritten here as:

```markdown
### GET /example/now

> Get POSIX timestamp

Example to show current POSIX timestamp.
```

### Built-in example routes

- `GET /`: Index page (returns project link).
- `GET /healthz`: Health check (plain text `blazing-asuna`).
- `GET /example`: Responds `Hello, world!`.
- `GET /example/hello/:name`: Responds `Hello, :name!`.

## Docker (optional)

This project includes a `Dockerfile`. Build and run it in your container platform,
and provide required environment variables (see Configuration section).

## License

Asuna is the microservice framework with [BSD-3-Clause licensed](LICENSE).

> (c) 2025 [Star Inc.](https://starinc.xyz)
