### Make sure you have installed rabbitMQ in your machine

* you can download via docker
```bash
    docker run -d --name rabbitmq \
    -p 5672:5672 -p 15672:15672 \
    rabbitmq:3-management
```

* you can install rabbitMQ on your local machine also if you are not using docker , just check the rabbitMQ docs.
* initially consumer would take time to insert and after that it would start working