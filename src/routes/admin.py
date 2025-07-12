from flask import Blueprint, request, jsonify, session
from models.client import db, Client, Document, Message, Admin
from routes.auth import admin_required
from datetime import datetime
import os

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/clients', methods=['GET'])
@admin_required
def get_clients():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        
        query = Client.query
        
        if search:
            query = query.filter(
                db.or_(
                    Client.name.contains(search),
                    Client.email.contains(search),
                    Client.company_name.contains(search)
                )
            )
        
        clients = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'clients': [client.to_dict() for client in clients.items],
            'total': clients.total,
            'pages': clients.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/clients/<int:client_id>', methods=['GET'])
@admin_required
def get_client_details(client_id):
    try:
        client = Client.query.get_or_404(client_id)
        documents = Document.query.filter_by(client_id=client_id).all()
        messages = Message.query.filter_by(client_id=client_id).order_by(Message.created_at.desc()).all()
        
        return jsonify({
            'client': client.to_dict(),
            'documents': [doc.to_dict() for doc in documents],
            'messages': [msg.to_dict() for msg in messages]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/clients/<int:client_id>/toggle-status', methods=['PUT'])
@admin_required
def toggle_client_status(client_id):
    try:
        client = Client.query.get_or_404(client_id)
        client.is_active = not client.is_active
        db.session.commit()
        
        return jsonify({
            'message': f'Cliente {"ativado" if client.is_active else "desativado"} com sucesso',
            'client': client.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/messages', methods=['GET'])
@admin_required
def get_all_messages():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unread_only = request.args.get('unread_only', False, type=bool)
        
        query = Message.query
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        messages = query.order_by(Message.created_at.desc()).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'messages': [msg.to_dict() for msg in messages.items],
            'total': messages.total,
            'pages': messages.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/messages/<int:message_id>/reply', methods=['POST'])
@admin_required
def reply_message(message_id):
    try:
        original_message = Message.query.get_or_404(message_id)
        data = request.get_json()
        
        if not data.get('content'):
            return jsonify({'error': 'Conteúdo da resposta é obrigatório'}), 400
        
        # Marcar mensagem original como lida
        original_message.is_read = True
        
        # Criar resposta
        reply = Message(
            client_id=original_message.client_id,
            sender_type='admin',
            sender_name=session.get('admin_username', 'Admin'),
            subject=f"Re: {original_message.subject}",
            content=data['content']
        )
        
        db.session.add(reply)
        db.session.commit()
        
        return jsonify({
            'message': 'Resposta enviada com sucesso',
            'reply': reply.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/documents', methods=['GET'])
@admin_required
def get_all_documents():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        documents = Document.query.join(Client).order_by(Document.uploaded_at.desc()).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        result = []
        for doc in documents.items:
            doc_dict = doc.to_dict()
            doc_dict['client_name'] = doc.client.name
            result.append(doc_dict)
        
        return jsonify({
            'documents': result,
            'total': documents.total,
            'pages': documents.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/documents/<int:document_id>/download', methods=['GET'])
@admin_required
def admin_download_document(document_id):
    try:
        document = Document.query.get_or_404(document_id)
        
        if not os.path.exists(document.file_path):
            return jsonify({'error': 'Arquivo não encontrado no servidor'}), 404
        
        from flask import send_file
        return send_file(
            document.file_path,
            as_attachment=True,
            download_name=document.original_filename
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    try:
        total_clients = Client.query.count()
        active_clients = Client.query.filter_by(is_active=True).count()
        total_documents = Document.query.count()
        unread_messages = Message.query.filter_by(is_read=False, sender_type='client').count()
        
        # Estatísticas dos últimos 30 dias
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        new_clients_30d = Client.query.filter(Client.created_at >= thirty_days_ago).count()
        new_documents_30d = Document.query.filter(Document.uploaded_at >= thirty_days_ago).count()
        new_messages_30d = Message.query.filter(Message.created_at >= thirty_days_ago).count()
        
        return jsonify({
            'total_clients': total_clients,
            'active_clients': active_clients,
            'total_documents': total_documents,
            'unread_messages': unread_messages,
            'new_clients_30d': new_clients_30d,
            'new_documents_30d': new_documents_30d,
            'new_messages_30d': new_messages_30d
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/create-admin', methods=['POST'])
def create_admin():
    """Rota temporária para criar admin inicial"""
    try:
        data = request.get_json()
        
        # Verificar se já existe admin
        if Admin.query.count() > 0:
            return jsonify({'error': 'Admin já existe'}), 400
        
        admin = Admin(
            username=data.get('username', 'admin'),
            email=data.get('email', 'admin@contabplus.com')
        )
        admin.set_password(data.get('password', 'admin123'))
        
        db.session.add(admin)
        db.session.commit()
        
        return jsonify({
            'message': 'Admin criado com sucesso',
            'admin': admin.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

