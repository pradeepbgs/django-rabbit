from django.apps import AppConfig


class LoggerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'logger'

    def ready(self):
        from .RabbitMQ.consumer import start_consumer_thread
        start_consumer_thread()