# Lævateinn (lavateinn)

Tiny and flexible microservice framework for fast development.

This is a microservice framework using Node.js + express.js,
provides the tree to write your service with a tidy and clear structure of project.

The framework is recommended to be used on light payload tasks.

![lavateinn](logo.png)

## Dependencies

The framework is required to have the following services running:

- Sequelize -  As the database to store the persistent data,
  using SQLite default for the development purpose,
  please change it to the other database for the production environment.
- Redis/Valkey - As the in-service memory for storing the cache data.
- RabbitMQ - As the message broker to send the message between services.

## Installation

Install the dependencies.

```shell
npm install
```

## Development

Hot-reload to help you create your application in fast,
reducing the time while debugging.

```shell
npm run dev
```

## Production

Start the service for providing to our dear clients!

```shell
npm start
```

## API

If you have no plan to create the swagger documentation,
you should write the API documentation in the `README.md` file.

For example,

the one jsdoc of OpenAPIs':

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

you should write the API documentation in the `README.md` file instead as:

```markdown
### GET /example/now

> Get POSIX timestamp

Example to show current POSIX timestamp.
```

### GET /example/now

> Get POSIX timestamp

Example to show current POSIX timestamp.

## License

Lævateinn is the microservice framework with [BSD-3-Clause licensed](LICENSE).

> (c) 2025 [Star Inc.](https://starinc.xyz)
