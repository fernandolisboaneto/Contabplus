from flask import Flask, send_from_directory
from flask_cors import CORS
from models.client import db
from routes.auth import auth_bp
from routes.client import client_bp
from routes.admin import admin_bp
import os

app = Flask(__name__, static_folder='static')

# Configurações
app.config['SECRET_KEY'] = 'contabplus-secret-key-2025'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///contabplus.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Inicializar extensões
db.init_app(app)
CORS(app, supports_credentials=True)

# Registrar blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(client_bp, url_prefix='/api/client')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Criar diretórios necessários
os.makedirs('uploads', exist_ok=True)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/client')
@app.route('/client/<path:path>')
def client_area(path=None):
    return send_from_directory(app.static_folder, 'client.html')

@app.route('/admin')
@app.route('/admin/<path:path>')
def admin_area(path=None):
    return send_from_directory(app.static_folder, 'admin.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)

