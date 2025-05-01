# Logger Service

A simple and efficient logging microservice that listens to a RabbitMQ queue and stores logs in a database. Ideal for use in a microservice or full-stack application architecture.

---

## Features

- Listens to a RabbitMQ queue for incoming HTTP request logs
- Buffers logs and performs bulk inserts into the database
- Reconnection logic to handle RabbitMQ disconnects
- Graceful shutdown support

---

## Tech Stack

- **Bun.js**
- **TypeScript**
- **RabbitMQ** (via `amqplib`)
- **Drizzle ORM** (for database operations)
- **SQlite ( you can use any DB you want , codebase if easy )**

---

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/pradeepbgs/loggers.git
cd logger-service
```

### 2. Install dependencies
```bash
cd logger_dieseljs
bun install
```

### 3. Setup environment variables
Create a `.env` file in the root directory:

```env
AMQBHOST=amqp://localhost
LOGS_QUEUE=request-logs
DATABASE_URL=your_postgres_database_url
or DB_FILE_NAME=your_sqlite_filename you want to give
```
### 4. Migrate the schema to sqlite
```bash
bun run generate
bun run migrate
```

### 5. Start the service
```bash
bun run dev
```

The service will connect to RabbitMQ, wait for messages on the `request-logs` queue, and insert logs in batches into the database.

---

## Notes

- Make sure RabbitMQ and PostgreSQL are running and accessible.
- Customize `BULK_INSERT_THRESHOLD` in code to control batch size.
- You can customize startConsuming code base and can make it save bulk data in a given time with setTimeout.

---

## License
MIT License

---

Made with ❤️ by Pradeep

