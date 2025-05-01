from django.shortcuts import render
from .models import RequestLog
from django.http import JsonResponse

def check_logs_in_DB(request):
    logs = RequestLog.objects.all().values()
    return JsonResponse({"logs": list(logs)}, safe=False)
