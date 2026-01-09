import json
import os
import psycopg2
import qrcode
import io
import base64
import random
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для создания и хранения документов с QR-кодами'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        return get_documents(user_id)
    elif method == 'POST':
        data = json.loads(event.get('body', '{}'))
        return create_document(user_id, data)
    
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

def get_documents(user_id: int) -> dict:
    '''Получение всех документов пользователя'''
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute(
        "SELECT id, document_type, first_name, last_name, middle_name, birth_date, passport_number, qr_code, created_at FROM documents WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,)
    )
    
    docs = []
    for row in cur.fetchall():
        docs.append({
            'id': row[0],
            'type': row[1],
            'first_name': row[2],
            'last_name': row[3],
            'middle_name': row[4],
            'birth_date': row[5].isoformat() if row[5] else None,
            'passport_number': row[6],
            'qr_code': row[7],
            'created_at': row[8].isoformat()
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'documents': docs})
    }

def create_document(user_id: int, data: dict) -> dict:
    '''Создание нового документа'''
    doc_type = data.get('type', 'passport')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    middle_name = data.get('middle_name', '')
    birth_date = data.get('birth_date')
    passport_number = data.get('passport_number', '')
    email = data.get('email', '')
    phone = data.get('phone', '')
    country = data.get('country', '')
    apartment = data.get('apartment', '')
    
    if not passport_number:
        passport_number = f"{random.randint(1000, 9999)} {random.randint(100000, 999999)}"
    
    qr_data = {
        'type': doc_type,
        'name': f"{last_name} {first_name} {middle_name}".strip(),
        'birth_date': birth_date,
        'passport': passport_number,
        'issued': datetime.utcnow().isoformat()
    }
    
    qr_code_base64 = generate_qr_code(json.dumps(qr_data))
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {os.environ['MAIN_DB_SCHEMA']}")
    
    cur.execute(
        "INSERT INTO documents (user_id, document_type, first_name, last_name, middle_name, birth_date, passport_number, email, phone, country, apartment, qr_code, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP) RETURNING id",
        (user_id, doc_type, first_name, last_name, middle_name, birth_date, passport_number, email, phone, country, apartment, qr_code_base64)
    )
    
    doc_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'id': doc_id,
            'passport_number': passport_number,
            'qr_code': qr_code_base64
        })
    }

def generate_qr_code(data: str) -> str:
    '''Генерация QR-кода в base64'''
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return 'data:image/png;base64,' + base64.b64encode(buffer.read()).decode()
