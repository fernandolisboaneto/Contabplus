from flask import Blueprint, request, jsonify, session, send_file
from werkzeug.utils import secure_filename
from models.client import db, Client, Document, Message
from routes.auth import login_required
import os
import uuid
from datetime import datetime

client_bp = Blueprint('client', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@client_bp.route('/documents', methods=['GET'])
@login_required
def get_documents():
    try:
        client_id = session['client_id']
        documents = Document.query.filter_by(client_id=client_id).order_by(Document.uploaded_at.desc()).all()
        
        return jsonify({
            'documents': [doc.to_dict() for doc in documents]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@client_bp.route('/documents/upload', methods=['POST'])
@login_required
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        description = request.form.get('description', '')
        
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
        
        if file and allowed_file(file.filename):
            # Criar diretório de upload se não existir
            client_id = session['client_id']
            client_upload_dir = os.path.join(UPLOAD_FOLDER, str(client_id))
            os.makedirs(client_upload_dir, exist_ok=True)
            
            # Gerar nome único para o arquivo
            original_filename = secure_filename(file.filename)
            file_extension = original_filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            file_path = os.path.join(client_upload_dir, unique_filename)
            
            # Salvar arquivo
            file.save(file_path)
            
            # Salvar informações no banco
            document = Document(
                client_id=client_id,
                filename=unique_filename,
                original_filename=original_filename,
                file_path=file_path,
                file_size=os.path.getsize(file_path),
                mime_type=file.content_type or 'application/octet-stream',
                description=description
            )
            
            db.session.add(document)
            db.session.commit()
            
            return jsonify({
                'message': 'Documento enviado com sucesso',
                'document': document.to_dict()
            }), 201
        else:
            return jsonify({'error': 'Tipo de arquivo não permitido'}), 400
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@client_bp.route('/documents/<int:document_id>/download', methods=['GET'])
@login_required
def download_document(document_id):
    try:
        client_id = session['client_id']
        document = Document.query.filter_by(id=document_id, client_id=client_id).first()
        
        if not document:
            return jsonify({'error': 'Documento não encontrado'}), 404
        
        if not os.path.exists(document.file_path):
            return jsonify({'error': 'Arquivo não encontrado no servidor'}), 404
        
        return send_file(
            document.file_path,
            as_attachment=True,
            download_name=document.original_filename
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@client_bp.route('/documents/<int:document_id>', methods=['DELETE'])
@login_required
def delete_document(document_id):
    try:
        client_id = session['client_id']
        document = Document.query.filter_by(id=document_id, client_id=client_id).first()
        
        if not document:
            return jsonify({'error': 'Documento não encontrado'}), 404
        
        # Remover arquivo do sistema
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Remover do banco
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({'message': 'Documento removido com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@client_bp.route('/messages', methods=['GET'])
@login_required
def get_messages():
    try:
        client_id = session['client_id']
        messages = Message.query.filter_by(client_id=client_id).order_by(Message.created_at.desc()).all()
        
        return jsonify({
            'messages': [msg.to_dict() for msg in messages]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@client_bp.route('/messages', methods=['POST'])
@login_required
def send_message():
    try:
        data = request.get_json()
        
        if not data.get('subject') or not data.get('content'):
            return jsonify({'error': 'Assunto e conteúdo são obrigatórios'}), 400
        
        client_id = session['client_id']
        client_name = session['client_name']
        
        message = Message(
            client_id=client_id,
            sender_type='client',
            sender_name=client_name,
            subject=data['subject'],
            content=data['content']
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'message': 'Mensagem enviada com sucesso',
            'data': message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@client_bp.route('/messages/<int:message_id>/read', methods=['PUT'])
@login_required
def mark_message_read(message_id):
    try:
        client_id = session['client_id']
        message = Message.query.filter_by(id=message_id, client_id=client_id).first()
        
        if not message:
            return jsonify({'error': 'Mensagem não encontrada'}), 404
        
        message.is_read = True
        db.session.commit()
        
        return jsonify({'message': 'Mensagem marcada como lida'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

