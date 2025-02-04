from django.shortcuts import render
from django.http import JsonResponse
import random
import string

# Function to generate a random string
def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def index(request):
    
    random_string = generate_random_string()
    random_number = random.randint(1000, 9999)

    return JsonResponse({
        "message": "Hello from message/ endpoint",
        "random_string": random_string,
        "random_number": random_number
    },status=200)
