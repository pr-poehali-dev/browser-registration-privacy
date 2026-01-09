import json
import os
import hashlib
import secrets
import time
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from urllib.parse import urlencode
import requests
import psycopg2
import random

def handler(event: dict, context) -> dict:
    '''Объединённый API: авторизация VK/Email, профиль, премиум, статистика'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': ''
        }
    
    query_params = event.get('queryStringParameters') or {}
    endpoint = query_params.get('endpoint', '')
    
    if endpoint == 'vk-login':
        return handle_vk_login(event)
    elif endpoint == 'vk-callback':
        return handle_vk_callback(event)
    elif endpoint == 'email-send-code':
        body = event.get('body', '{}')
        data = json.loads(body) if isinstance(body, str) else body
        return send_verification_code(data)
    elif endpoint == 'email-verify-code':
        body = event.get('body', '{}')
        data = json.loads(body) if isinstance(body, str) else body
        return verify_code(data)
    elif endpoint == 'email-register':
        body = event.get('body', '{}')
        data = json.loads(body) if isinstance(body, str) else body
        return register_user(data)
    
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    user_id = verify_token(auth_header)
    
    if not user_id and endpoint not in ['vk-login', 'vk-callback', 'email-send-code', 'email-verify-code', 'email-register']:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    if endpoint == 'premium':
        if method == 'GET':
            return get_premium_status(user_id)
        elif method == 'POST':
            body = event.get('body', '{}')
            data = json.loads(body) if isinstance(body, str) else body
            return activate_premium(user_id, data)
    elif endpoint == 'profile':
        if method == 'GET':
            return get_profile(user_id)
        elif method == 'PUT':
            body = event.get('body', '{}')
            data = json.loads(body) if isinstance(body, str) else body
            return update_profile(user_id, data)
    elif endpoint == 'statistics':
        return get_statistics(user_id)
    
    return {'statusCode': 404, 'body': json.dumps({'error': 'Not found'})}

def handle_vk_login(event: dict) -> dict:
    '''Перенаправление на VK OAuth'''
    vk_app_id = os.environ.get('VK_APP_ID')
    redirect_uri = event.get('headers', {}).get('origin', 'http://localhost:5173') + '/auth/vk/callback'
    
    params = {
        'client_id': vk_app_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'email',
        'state': secrets.token_urlsafe(32)
    }
    
    auth_url = f"https://oauth.vk.com/authorize?{urlencode(params)}"
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'redirect_url': auth_url})
    }

def handle_vk_callback(event: dict) -> dict:
    '''Обработка callback от VK и создание сессии'''
    params = event.get('queryStringParameters', {})
    code = params.get('code')
    
    if not code:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No authorization code'})
        }
    
    vk_app_id = os.environ.get('VK_APP_ID')
    vk_app_secret = os.environ.get('VK_APP_SECRET')
    redirect_uri = event.get('headers', {}).get('origin', 'http://localhost:5173') + '/auth/vk/callback'
    
    token_url = 'https://oauth.vk.com/access_token'
    token_params = {
        'client_id': vk_app_id,
        'client_secret': vk_app_secret,
        'redirect_uri': redirect_uri,
        'code': code
    }
    
    token_response = requests.get(token_url, params=token_params)
    token_data = token_response.json()
    
    if 'error' in token_data:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': token_data['error']})
        }
    
    vk_user_id = str(token_data.get('user_id'))
    email = token_data.get('email')
    
    api_url = 'https://api.vk.com/method/users.get'
    api_params = {
        'user_ids': vk_user_id,
        'fields': 'photo_200',
        'access_token': token_data['access_token'],
        'v': '5.131'
    }
    
    user_response = requests.get(api_url, params=api_params)
    user_data = user_response.json().get('response', [{}])[0]
    
    name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}"
    avatar_url = user_data.get('photo_200')
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute("SELECT id FROM users WHERE vk_id = %s", (vk_user_id,))
    user_row = cur.fetchone()
    
    if user_row:
        user_id = user_row[0]
        cur.execute(
            "UPDATE users SET last_login_at = CURRENT_TIMESTAMP, name = %s, avatar_url = %s WHERE id = %s",
            (name, avatar_url, user_id)
        )
    else:
        cur.execute(
            "INSERT INTO users (vk_id, email, name, avatar_url, email_verified, created_at) VALUES (%s, %s, %s, %s, TRUE, CURRENT_TIMESTAMP) RETURNING id",
            (vk_user_id, email, name, avatar_url)
        )
        user_id = cur.fetchone()[0]
    
    access_token = create_jwt(user_id)
    refresh_token = secrets.token_urlsafe(32)
    refresh_token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    
    cur.execute(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (%s, %s, %s)",
        (user_id, refresh_token_hash, datetime.utcnow() + timedelta(days=30))
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {'id': user_id, 'name': name, 'email': email, 'avatar_url': avatar_url}
        })
    }

def send_verification_code(data: dict) -> dict:
    '''Отправка кода подтверждения на email'''
    email = data.get('email', '').lower().strip()
    
    if not email or '@' not in email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid email'})
        }
    
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute("UPDATE email_verification_codes SET expires_at = CURRENT_TIMESTAMP WHERE email = %s", (email,))
    
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    cur.execute(
        "INSERT INTO email_verification_codes (email, code, expires_at) VALUES (%s, %s, %s)",
        (email, code, expires_at)
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    send_email(email, code)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Code sent', 'code_for_demo': code})
    }

def send_email(to_email: str, code: str):
    '''Отправка email через SMTP'''
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    
    msg = MIMEText(f'Ваш код подтверждения: {code}\n\nКод действителен 10 минут.', 'plain', 'utf-8')
    msg['Subject'] = 'Код подтверждения'
    msg['From'] = smtp_user
    msg['To'] = to_email
    
    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    except Exception as e:
        print(f'Email error: {e}')

def verify_code(data: dict) -> dict:
    '''Проверка кода подтверждения'''
    email = data.get('email', '').lower().strip()
    code = data.get('code', '').strip()
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute(
        "SELECT code, expires_at FROM email_verification_codes WHERE email = %s ORDER BY created_at DESC LIMIT 1",
        (email,)
    )
    row = cur.fetchone()
    
    if not row:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Code not found'})
        }
    
    stored_code, expires_at = row
    
    if datetime.utcnow() > expires_at:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Code expired'})
        }
    
    if stored_code != code:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid code'})
        }
    
    cur.execute("UPDATE email_verification_codes SET expires_at = CURRENT_TIMESTAMP WHERE email = %s", (email,))
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Code verified', 'email': email})
    }

def register_user(data: dict) -> dict:
    '''Регистрация пользователя после подтверждения email'''
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    name = data.get('name', '')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email and password required'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    existing = cur.fetchone()
    
    if existing:
        user_id = existing[0]
    else:
        cur.execute(
            "INSERT INTO users (email, name, email_verified, created_at) VALUES (%s, %s, TRUE, CURRENT_TIMESTAMP) RETURNING id",
            (email, name)
        )
        user_id = cur.fetchone()[0]
    
    access_token = create_jwt(user_id)
    refresh_token = secrets.token_urlsafe(32)
    refresh_token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    
    cur.execute(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (%s, %s, %s)",
        (user_id, refresh_token_hash, datetime.utcnow() + timedelta(days=30))
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {'id': user_id, 'email': email, 'name': name}
        })
    }

def get_premium_status(user_id: int) -> dict:
    '''Получение статуса премиум подписки'''
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute(
        "SELECT premium_until, premium_type, birthday FROM users WHERE id = %s",
        (user_id,)
    )
    
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'})
        }
    
    premium_until, premium_type, birthday = row
    is_premium = premium_until and premium_until > datetime.utcnow()
    is_birthday = False
    
    if birthday:
        today = datetime.utcnow().date()
        is_birthday = (today.month == birthday.month and today.day == birthday.day)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'is_premium': is_premium,
            'premium_type': premium_type,
            'premium_until': premium_until.isoformat() if premium_until else None,
            'is_birthday': is_birthday
        })
    }

def activate_premium(user_id: int, data: dict) -> dict:
    '''Активация премиум подписки'''
    plan = data.get('plan', 'trial')
    
    if plan == 'trial':
        premium_until = datetime.utcnow() + timedelta(days=30)
        premium_type = 'pro_analytics'
    elif plan == 'year':
        premium_until = datetime.utcnow() + timedelta(days=365)
        premium_type = 'pro_analytics'
    else:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid plan'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute(
        "UPDATE users SET premium_until = %s, premium_type = %s WHERE id = %s",
        (premium_until, premium_type, user_id)
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'message': 'Premium activated',
            'premium_until': premium_until.isoformat(),
            'premium_type': premium_type
        })
    }

def get_profile(user_id: int) -> dict:
    '''Получение профиля пользователя'''
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute(
        "SELECT id, email, name, avatar_url, birthday, premium_until, premium_type FROM users WHERE id = %s",
        (user_id,)
    )
    
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'})
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'id': row[0],
            'email': row[1],
            'name': row[2],
            'avatar_url': row[3],
            'birthday': row[4].isoformat() if row[4] else None,
            'is_premium': row[5] and row[5] > datetime.utcnow(),
            'premium_type': row[6]
        })
    }

def update_profile(user_id: int, data: dict) -> dict:
    '''Обновление профиля пользователя'''
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    if 'name' in data:
        cur.execute("UPDATE users SET name = %s WHERE id = %s", (data['name'], user_id))
    
    if 'birthday' in data and data['birthday']:
        cur.execute("UPDATE users SET birthday = %s WHERE id = %s", (data['birthday'], user_id))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Profile updated'})
    }

def get_statistics(user_id: int) -> dict:
    '''Получение статистики пользователя'''
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute(
        "SELECT action_type, COUNT(*) as count FROM statistics WHERE user_id = %s GROUP BY action_type ORDER BY count DESC",
        (user_id,)
    )
    
    stats = {}
    for row in cur.fetchall():
        stats[row[0]] = row[1]
    
    cur.execute(
        "SELECT COUNT(*) FROM statistics WHERE user_id = %s AND created_at > NOW() - INTERVAL '7 days'",
        (user_id,)
    )
    
    week_count = cur.fetchone()[0]
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'total_actions': sum(stats.values()),
            'week_actions': week_count,
            'by_type': stats
        })
    }

def create_jwt(user_id: int) -> str:
    '''Создание JWT токена'''
    import base64
    import hmac
    
    header = base64.urlsafe_b64encode(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode()).decode().rstrip('=')
    
    payload = {
        'user_id': user_id,
        'exp': int(time.time()) + 3600
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    
    secret = os.environ.get('JWT_SECRET', 'default-secret-key')
    signature = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), f"{header}.{payload_b64}".encode(), hashlib.sha256).digest()
    ).decode().rstrip('=')
    
    return f"{header}.{payload_b64}.{signature}"

def verify_token(auth_header: str) -> int:
    '''Проверка JWT токена'''
    if not auth_header or not auth_header.startswith('Bearer '):
        return 0
    
    token = auth_header.replace('Bearer ', '')
    
    try:
        import base64
        import hmac
        
        parts = token.split('.')
        if len(parts) != 3:
            return 0
        
        header, payload_b64, signature = parts
        
        secret = os.environ.get('JWT_SECRET', 'default-secret-key')
        expected_sig = base64.urlsafe_b64encode(
            hmac.new(secret.encode(), f"{header}.{payload_b64}".encode(), hashlib.sha256).digest()
        ).decode().rstrip('=')
        
        if signature != expected_sig:
            return 0
        
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + '=='))
        return payload.get('user_id', 0)
    except:
        return 0