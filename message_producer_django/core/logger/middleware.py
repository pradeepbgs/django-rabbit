from django.utils.deprecation import MiddlewareMixin
import json
from datetime import datetime
from .RabbitMQ.producer import publish_message
class RequestResponseLogger(MiddlewareMixin):
    def process_request(self, request):
        request._body = request.body.decode('utf-8') if request.body else None

    def process_response(self, request, response):
        headers = {k: v for k, v in request.headers.items()}
        res = response.content.decode('utf-8') if response.content else ''


        log_data = {
            'method': request.method,
            'path': request.path,
            'headers': headers,
            'body': request._body,
            "response_status": response.status_code,
            "response_body": res,
            "timestamp":datetime.utcnow().isoformat()
        }

        publish_message(log_data)

        # if response.get('Content-Type') == 'application/json':
        #     try:
                
        #         res_data = json.loads(res)
        #         print(json.dumps(res_data,indent=4))
        #     except:
        #         print(res)
        # else:
        #     # For non-JSON responses, print the raw content
        #     print(res)

        return response
