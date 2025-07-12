from flask import Blueprint, request, jsonify, session, redirect, url_for
from models.client import db, Client, Admin
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'client_id' not in session:
            return jsonify({'error': 'Login required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return jsonify({'error': 'Admin access required'}), 401
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validação básica
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se email já existe
        if Client.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Criar novo cliente
        client = Client(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone'),
            company_name=data.get('company_name'),
            cnpj=data.get('cnpj')
        )
        client.set_password(data['password'])
        
        db.session.add(client)
        db.session.commit()
        
        return jsonify({
            'message': 'Cliente cadastrado com sucesso',
            'client': client.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        client = Client.query.filter_by(email=data['email']).first()
        
        if client and client.check_password(data['password']) and client.is_active:
            session['client_id'] = client.id
            session['client_name'] = client.name
            return jsonify({
                'message': 'Login realizado com sucesso',
                'client': client.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Email ou senha inválidos'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username e senha são obrigatórios'}), 400
        
        admin = Admin.query.filter_by(username=data['username']).first()
        
        if admin and admin.check_password(data['password']) and admin.is_active:
            session['admin_id'] = admin.id
            session['admin_username'] = admin.username
            return jsonify({
                'message': 'Login admin realizado com sucesso',
                'admin': admin.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Username ou senha inválidos'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout realizado com sucesso'}), 200

@auth_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    try:
        client = Client.query.get(session['client_id'])
        if not client:
            return jsonify({'error': 'Cliente não encontrado'}), 404
        
        return jsonify({'client': client.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    try:
        client = Client.query.get(session['client_id'])
        if not client:
            return jsonify({'error': 'Cliente não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'name' in data:
            client.name = data['name']
        if 'phone' in data:
            client.phone = data['phone']
        if 'company_name' in data:
            client.company_name = data['company_name']
        if 'cnpj' in data:
            client.cnpj = data['cnpj']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'client': client.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

