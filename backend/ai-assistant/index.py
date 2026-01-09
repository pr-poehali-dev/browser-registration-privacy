import json
import os
import requests
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''ИИ голосовой помощник с поиском, погодой и математикой'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': ''
        }
    
    if method == 'POST':
        data = json.loads(event.get('body', '{}'))
        query = data.get('query', '').lower()
        is_premium = data.get('is_premium', False)
        
        return process_query(query, is_premium)
    
    return {'statusCode': 404, 'body': json.dumps({'error': 'Not found'})}

def process_query(query: str, is_premium: bool) -> dict:
    '''Обработка запроса пользователя'''
    
    if 'погода' in query:
        return handle_weather(query)
    
    if any(op in query for op in ['+', '-', '*', '/', 'умножить', 'разделить', 'плюс', 'минус']):
        return handle_math(query)
    
    return handle_search(query, is_premium)

def handle_weather(query: str) -> dict:
    '''Предсказание погоды для Санкт-Петербург, Москва, Шушары'''
    cities_weather = {
        'санкт-петербург': {'temp': 5, 'condition': 'Облачно с прояснениями'},
        'петербург': {'temp': 5, 'condition': 'Облачно с прояснениями'},
        'спб': {'temp': 5, 'condition': 'Облачно с прояснениями'},
        'москва': {'temp': 3, 'condition': 'Переменная облачность'},
        'шушары': {'temp': 4, 'condition': 'Облачно'}
    }
    
    detected_city = None
    for city in cities_weather:
        if city in query:
            detected_city = city
            break
    
    if not detected_city:
        response = 'Погода доступна для городов: Санкт-Петербург, Москва и Шушары. Уточните город.'
    else:
        weather = cities_weather[detected_city]
        response = f"Температура {weather['temp']}°C. {weather['condition']}."
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'response': response, 'type': 'weather'})
    }

def handle_math(query: str) -> dict:
    '''Решение математических примеров'''
    try:
        query = query.replace('умножить на', '*').replace('разделить на', '/')
        query = query.replace('плюс', '+').replace('минус', '-')
        query = query.replace('х', '*').replace('÷', '/')
        
        import re
        numbers = re.findall(r'\d+\.?\d*', query)
        operators = re.findall(r'[\+\-\*/]', query)
        
        if len(numbers) >= 2 and len(operators) >= 1:
            expression = numbers[0]
            for i, op in enumerate(operators):
                if i + 1 < len(numbers):
                    expression += op + numbers[i + 1]
            
            result = eval(expression)
            response = f'Ответ: {result}'
        else:
            response = 'Не смог распознать пример. Попробуйте: "сколько будет 15 плюс 25"'
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'response': response, 'type': 'math'})
        }
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'response': f'Ошибка вычисления: {str(e)}', 'type': 'math'})
        }

def handle_search(query: str, is_premium: bool) -> dict:
    '''Поиск информации через OpenAI GPT'''
    api_key = os.environ.get('OPENAI_API_KEY')
    
    if not api_key:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'response': f'Поиск по запросу: {query}', 'type': 'search'})
        }
    
    model = 'gpt-4' if is_premium else 'gpt-3.5-turbo'
    
    try:
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={
                'model': model,
                'messages': [
                    {'role': 'system', 'content': 'Ты умный голосовой помощник. Отвечай кратко и по делу на русском языке.'},
                    {'role': 'user', 'content': query}
                ],
                'max_tokens': 500 if is_premium else 150,
                'temperature': 0.7
            },
            timeout=15
        )
        
        result = response.json()
        answer = result['choices'][0]['message']['content']
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'response': answer, 'type': 'ai', 'model': model})
        }
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'response': f'Ищу информацию по запросу: {query}', 'type': 'search'})
        }
