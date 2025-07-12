// Estado da aplicação
let currentClient = null;

// Elementos DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const clientArea = document.getElementById('clientArea');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Toggle entre login e registro
    showRegisterLink.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });
    
    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
    
    // Forms
    document.getElementById('clientLoginForm').addEventListener('submit', handleLogin);
    document.getElementById('clientRegisterForm').addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('messageForm').addEventListener('submit', handleSendMessage);
    
    // Upload de arquivos
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    fileInput.addEventListener('change', handleFileUpload);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFileUpload({ target: { files } });
    });
});

// Verificar status de autenticação
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/profile', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentClient = data.client;
            showClientArea();
        } else {
            showLoginForm();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        showLoginForm();
    }
}

// Mostrar formulário de login
function showLoginForm() {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    clientArea.classList.add('hidden');
}

// Mostrar área do cliente
function showClientArea() {
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    clientArea.classList.remove('hidden');
    
    document.getElementById('clientName').textContent = currentClient.name;
    loadDocuments();
    loadMessages();
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentClient = result.client;
            showClientArea();
            showNotification('Login realizado com sucesso!', 'success');
        } else {
            showNotification(result.error || 'Erro no login', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showNotification('Erro de conexão', 'error');
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Cadastro realizado com sucesso! Faça login.', 'success');
            showLoginForm();
            e.target.reset();
        } else {
            showNotification(result.error || 'Erro no cadastro', 'error');
        }
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showNotification('Erro de conexão', 'error');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        currentClient = null;
        showLoginForm();
        showNotification('Logout realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// Carregar documentos
async function loadDocuments() {
    try {
        const response = await fetch('/api/client/documents', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayDocuments(data.documents);
        }
    } catch (error) {
        console.error('Erro ao carregar documentos:', error);
    }
}

// Exibir documentos
function displayDocuments(documents) {
    const documentList = document.getElementById('documentList');
    
    if (documents.length === 0) {
        documentList.innerHTML = '<p style="text-align: center; color: var(--text-light);">Nenhum documento enviado ainda.</p>';
        return;
    }
    
    documentList.innerHTML = documents.map(doc => `
        <div class="document-item">
            <div class="document-info">
                <h4>${doc.original_filename}</h4>
                <p>Enviado em ${new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}</p>
                <p>${(doc.file_size / 1024).toFixed(1)} KB</p>
            </div>
            <div class="document-actions">
                <button class="btn-small btn-download" onclick="downloadDocument(${doc.id})">
                    Baixar
                </button>
                <button class="btn-small btn-delete" onclick="deleteDocument(${doc.id})">
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Upload de arquivos
async function handleFileUpload(e) {
    const files = e.target.files;
    
    for (let file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', '');
        
        try {
            const response = await fetch('/api/client/documents/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showNotification(`Arquivo ${file.name} enviado com sucesso!`, 'success');
                loadDocuments();
            } else {
                showNotification(result.error || `Erro ao enviar ${file.name}`, 'error');
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            showNotification(`Erro ao enviar ${file.name}`, 'error');
        }
    }
    
    // Limpar input
    e.target.value = '';
}

// Download de documento
async function downloadDocument(documentId) {
    try {
        const response = await fetch(`/api/client/documents/${documentId}/download`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            showNotification('Erro ao baixar documento', 'error');
        }
    } catch (error) {
        console.error('Erro no download:', error);
        showNotification('Erro ao baixar documento', 'error');
    }
}

// Excluir documento
async function deleteDocument(documentId) {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/client/documents/${documentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Documento excluído com sucesso!', 'success');
            loadDocuments();
        } else {
            showNotification(result.error || 'Erro ao excluir documento', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir documento:', error);
        showNotification('Erro ao excluir documento', 'error');
    }
}

// Carregar mensagens
async function loadMessages() {
    try {
        const response = await fetch('/api/client/messages', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayMessages(data.messages);
        }
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

// Exibir mensagens
function displayMessages(messages) {
    const messageList = document.getElementById('messageList');
    
    if (messages.length === 0) {
        messageList.innerHTML = '<p style="text-align: center; color: var(--text-light);">Nenhuma mensagem ainda.</p>';
        return;
    }
    
    messageList.innerHTML = messages.map(msg => `
        <div class="message-item">
            <div class="message-header">
                <span class="message-subject">${msg.subject}</span>
                <span class="message-date">${new Date(msg.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="message-content">${msg.content}</div>
            <small style="color: var(--text-light);">De: ${msg.sender_name} (${msg.sender_type === 'client' ? 'Você' : 'Admin'})</small>
        </div>
    `).join('');
}

// Enviar mensagem
async function handleSendMessage(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/client/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Mensagem enviada com sucesso!', 'success');
            e.target.reset();
            loadMessages();
        } else {
            showNotification(result.error || 'Erro ao enviar mensagem', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showNotification('Erro ao enviar mensagem', 'error');
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

