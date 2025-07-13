// Client Area JavaScript

// Global state
let currentUser = null;
let currentTab = 'overview';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeEventListeners();
    initializeFileUpload();
});

// Check if user is authenticated
function checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
        currentUser = JSON.parse(userData);
        showDashboard();
    } else {
        showLogin();
    }
}

// Show login section
function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('nav-user').style.display = 'none';
}

// Show dashboard section
function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('nav-user').style.display = 'flex';
    
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('dashboard-user-name').textContent = currentUser.name;
        loadDashboardData();
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Message form
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', handleSendMessage);
    }
    
    // Upload form
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadDocument);
    }
    
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleUpdateProfile);
    }
    
    // Change password form
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
}

// Tab switching
function showTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

// Dashboard tab switching
function showDashboardTab(tabName) {
    currentTab = tabName;
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));
    
    // Add active class to selected tab
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Load tab-specific data
    loadTabData(tabName);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        showLoading(e.target.querySelector('button[type="submit"]'));
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('auth_token', result.token);
            localStorage.setItem('user_data', JSON.stringify(result.user));
            currentUser = result.user;
            showDashboard();
            showNotification('Login realizado com sucesso!', 'success');
        } else {
            showNotification(result.message || 'Erro ao fazer login', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    } finally {
        hideLoading(e.target.querySelector('button[type="submit"]'));
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    
    if (password !== confirmPassword) {
        showNotification('As senhas não coincidem', 'error');
        return;
    }
    
    const registerData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        cnpj: formData.get('cnpj'),
        password: password
    };
    
    try {
        showLoading(e.target.querySelector('button[type="submit"]'));
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Conta criada com sucesso! Faça login para continuar.', 'success');
            showTab('login');
        } else {
            showNotification(result.message || 'Erro ao criar conta', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    } finally {
        hideLoading(e.target.querySelector('button[type="submit"]'));
    }
}

// Handle logout
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    currentUser = null;
    showLogin();
    showNotification('Logout realizado com sucesso!', 'success');
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/client/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDashboardStats(data);
            loadTabData(currentTab);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update dashboard stats
function updateDashboardStats(data) {
    document.getElementById('documents-count').textContent = data.documents_count || 0;
    document.getElementById('taxes-count').textContent = data.taxes_count || 0;
    document.getElementById('messages-count').textContent = data.messages_count || 0;
}

// Load tab-specific data
async function loadTabData(tabName) {
    const token = localStorage.getItem('auth_token');
    
    switch (tabName) {
        case 'documents':
            await loadDocuments(token);
            break;
        case 'taxes':
            await loadTaxes(token);
            break;
        case 'messages':
            await loadMessages(token);
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Load documents
async function loadDocuments(token) {
    try {
        const response = await fetch('/api/client/documents', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const documents = await response.json();
            renderDocuments(documents);
        }
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

// Render documents
function renderDocuments(documents) {
    const container = document.getElementById('documents-list');
    
    if (documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>Nenhum documento enviado</h3>
                <p>Clique em "Enviar Documento" para começar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = documents.map(doc => `
        <div class="document-card">
            <div class="document-header">
                <span class="document-type">${doc.type}</span>
                <span class="document-date">${formatDate(doc.created_at)}</span>
            </div>
            <div class="document-name">${doc.filename}</div>
            <div class="document-description">${doc.description || 'Sem descrição'}</div>
            <div class="document-actions">
                <button class="btn btn-outline btn-sm" onclick="downloadDocument(${doc.id})">
                    <i class="fas fa-download"></i>
                    Baixar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteDocument(${doc.id})">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Load taxes
async function loadTaxes(token) {
    try {
        const response = await fetch('/api/client/taxes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const taxes = await response.json();
            renderTaxes(taxes);
        }
    } catch (error) {
        console.error('Error loading taxes:', error);
    }
}

// Render taxes
function renderTaxes(taxes) {
    const container = document.getElementById('taxes-list');
    
    if (taxes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calculator"></i>
                <h3>Nenhum imposto cadastrado</h3>
                <p>Seus impostos aparecerão aqui quando forem calculados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = taxes.map(tax => `
        <div class="tax-card">
            <div class="tax-header">
                <div class="tax-name">${tax.name}</div>
                <div class="tax-amount">R$ ${tax.amount.toFixed(2)}</div>
            </div>
            <div class="tax-due-date">Vencimento: ${formatDate(tax.due_date)}</div>
            <div class="tax-status ${tax.status}">
                <i class="fas fa-${getStatusIcon(tax.status)}"></i>
                ${getStatusText(tax.status)}
            </div>
        </div>
    `).join('');
}

// Load messages
async function loadMessages(token) {
    try {
        const response = await fetch('/api/client/messages', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            renderMessages(messages);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Render messages
function renderMessages(messages) {
    const container = document.getElementById('messages-chat');
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <h3>Nenhuma mensagem</h3>
                <p>Inicie uma conversa com seu contador</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender === 'client' ? 'sent' : 'received'}">
            <div class="message-content">${msg.content}</div>
            <div class="message-time">${formatDateTime(msg.created_at)}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Load profile
function loadProfile() {
    if (currentUser) {
        document.getElementById('profile-name').value = currentUser.name || '';
        document.getElementById('profile-email').value = currentUser.email || '';
        document.getElementById('profile-phone').value = currentUser.phone || '';
        document.getElementById('profile-cnpj').value = currentUser.cnpj || '';
        document.getElementById('profile-company').value = currentUser.company || '';
    }
}

// Handle send message
async function handleSendMessage(e) {
    e.preventDefault();
    
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    
    if (!content) return;
    
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/client/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            messageInput.value = '';
            await loadMessages(token);
        } else {
            showNotification('Erro ao enviar mensagem', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    }
}

// Handle upload document
async function handleUploadDocument(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const token = localStorage.getItem('auth_token');
    
    try {
        showLoading(e.target.querySelector('button[type="submit"]'));
        
        const response = await fetch('/api/client/documents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            closeModal('upload-modal');
            e.target.reset();
            await loadDocuments(token);
            showNotification('Documento enviado com sucesso!', 'success');
        } else {
            const result = await response.json();
            showNotification(result.message || 'Erro ao enviar documento', 'error');
        }
    } catch (error) {
        console.error('Error uploading document:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    } finally {
        hideLoading(e.target.querySelector('button[type="submit"]'));
    }
}

// Handle update profile
async function handleUpdateProfile(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        cnpj: formData.get('cnpj'),
        company: formData.get('company')
    };
    
    try {
        showLoading(e.target.querySelector('button[type="submit"]'));
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/client/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            const result = await response.json();
            currentUser = result.user;
            localStorage.setItem('user_data', JSON.stringify(currentUser));
            document.getElementById('user-name').textContent = currentUser.name;
            document.getElementById('dashboard-user-name').textContent = currentUser.name;
            showNotification('Perfil atualizado com sucesso!', 'success');
        } else {
            const result = await response.json();
            showNotification(result.message || 'Erro ao atualizar perfil', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    } finally {
        hideLoading(e.target.querySelector('button[type="submit"]'));
    }
}

// Handle change password
async function handleChangePassword(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_new_password');
    
    if (newPassword !== confirmPassword) {
        showNotification('As senhas não coincidem', 'error');
        return;
    }
    
    const passwordData = {
        current_password: formData.get('current_password'),
        new_password: newPassword
    };
    
    try {
        showLoading(e.target.querySelector('button[type="submit"]'));
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/client/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(passwordData)
        });
        
        if (response.ok) {
            closeModal('change-password-modal');
            e.target.reset();
            showNotification('Senha alterada com sucesso!', 'success');
        } else {
            const result = await response.json();
            showNotification(result.message || 'Erro ao alterar senha', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    } finally {
        hideLoading(e.target.querySelector('button[type="submit"]'));
    }
}

// Modal functions
function showUploadModal() {
    document.getElementById('upload-modal').classList.add('active');
}

function showChangePasswordModal() {
    document.getElementById('change-password-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showForgotPassword() {
    showNotification('Funcionalidade em desenvolvimento. Entre em contato conosco.', 'info');
}

// Document functions
async function downloadDocument(documentId) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/client/documents/${documentId}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `document_${documentId}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            showNotification('Erro ao baixar documento', 'error');
        }
    } catch (error) {
        console.error('Error downloading document:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    }
}

async function deleteDocument(documentId) {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/client/documents/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            await loadDocuments(token);
            showNotification('Documento excluído com sucesso!', 'success');
        } else {
            showNotification('Erro ao excluir documento', 'error');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        showNotification('Erro de conexão. Tente novamente.', 'error');
    }
}

// Tax functions
function refreshTaxes() {
    const token = localStorage.getItem('auth_token');
    loadTaxes(token);
    showNotification('Impostos atualizados!', 'success');
}

// File upload initialization
function initializeFileUpload() {
    const fileInput = document.getElementById('document-file');
    const uploadArea = document.getElementById('file-upload-area');
    
    if (!fileInput || !uploadArea) return;
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            updateFileDisplay(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            updateFileDisplay(e.target.files[0]);
        }
    });
}

function updateFileDisplay(file) {
    const uploadArea = document.getElementById('file-upload-area');
    const placeholder = uploadArea.querySelector('.upload-placeholder');
    
    placeholder.innerHTML = `
        <i class="fas fa-file"></i>
        <p><strong>${file.name}</strong></p>
        <small>${formatFileSize(file.size)}</small>
    `;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusIcon(status) {
    const icons = {
        pending: 'clock',
        paid: 'check-circle',
        overdue: 'exclamation-triangle',
        completed: 'check-circle'
    };
    return icons[status] || 'clock';
}

function getStatusText(status) {
    const texts = {
        pending: 'Pendente',
        paid: 'Pago',
        overdue: 'Vencido',
        completed: 'Concluído'
    };
    return texts[status] || 'Pendente';
}

function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
}

function hideLoading(button) {
    button.disabled = false;
    button.innerHTML = button.getAttribute('data-original-text') || 'Enviar';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Handle escape key for modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

