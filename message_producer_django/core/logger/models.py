from django.db import models

class RequestLog(models.Model):
    method = models.CharField(max_length=10)
    path = models.TextField()
    headers = models.TextField()
    body = models.TextField(blank=True, null=True)
    response_status = models.IntegerField()
    response_body = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.method} {self.path} - {self.response_status}"
