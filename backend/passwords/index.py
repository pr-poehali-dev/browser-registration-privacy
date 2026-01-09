import json
import os
import psycopg2
import hashlib
import base64

def handler(event: dict, context) -> dict:
    '''Менеджер паролей с шифрованием'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': ''
        }
    
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    user_id = verify_token(auth_header)
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    if method == 'GET':
        return get_passwords(user_id)
    elif method == 'POST':
        data = json.loads(event.get('body', '{}'))
        return save_password(user_id, data)
    elif method == 'DELETE':
        data = json.loads(event.get('body', '{}'))
        return delete_password(user_id, data.get('id'))
    
    return {'statusCode': 404, 'body': json.dumps({'error': 'Not found'})}

def verify_token(auth_header: str) -> int:
    '''Проверка JWT токена'''
    if not auth_header or not auth_header.startswith('Bearer '):
        return 0
    
    token = auth_header.replace('Bearer ', '')
    
    try:
        import base64
        import hmac
        import hashlib
        
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

def get_passwords(user_id: int) -> dict:
    '''Получение всех паролей пользователя'''
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute(
        "SELECT id, site_url, site_name, username, encrypted_password, created_at FROM passwords WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,)
    )
    
    passwords = []
    for row in cur.fetchall():
        passwords.append({
            'id': row[0],
            'site_url': row[1],
            'site_name': row[2],
            'username': row[3],
            'password': decrypt_password(row[4]),
            'created_at': row[5].isoformat()
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'passwords': passwords})
    }

def save_password(user_id: int, data: dict) -> dict:
    '''Сохранение пароля'''
    site_url = data.get('site_url', '')
    site_name = data.get('site_name', '')
    username = data.get('username', '')
    password = data.get('password', '')
    
    if not site_url or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Site URL and password required'})
        }
    
    encrypted = encrypt_password(password)
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute(
        "INSERT INTO passwords (user_id, site_url, site_name, username, encrypted_password, created_at) VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP) RETURNING id",
        (user_id, site_url, site_name, username, encrypted)
    )
    
    password_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'id': password_id, 'message': 'Password saved'})
    }

def delete_password(user_id: int, password_id: int) -> dict:
    '''Удаление пароля'''
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute("UPDATE passwords SET encrypted_password = '' WHERE id = %s AND user_id = %s", (password_id, user_id))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Password deleted'})
    }

def encrypt_password(password: str) -> str:
    '''Простое шифрование пароля (XOR + base64)'''
    key = os.environ.get('JWT_SECRET', 'default-secret-key')[:32]
    encrypted = ''.join(chr(ord(c) ^ ord(key[i % len(key)])) for i, c in enumerate(password))
    return base64.b64encode(encrypted.encode('latin1')).decode()

def decrypt_password(encrypted: str) -> str:
    '''Расшифровка пароля'''
    try:
        key = os.environ.get('JWT_SECRET', 'default-secret-key')[:32]
        decoded = base64.b64decode(encrypted).decode('latin1')
        return ''.join(chr(ord(c) ^ ord(key[i % len(key)])) for i, c in enumerate(decoded))
    except:
        return ''
