# ContabPlus - Contabilidade Especializada

![ContabPlus Logo](src/static/logo.png)

## 📋 Sobre o Projeto

A ContabPlus é uma plataforma de contabilidade online moderna e especializada, desenvolvida para oferecer soluções contábeis completas e personalizadas para empresas de todos os portes. Inspirada nos melhores práticas do mercado (Contabilizei, Agilize, ContaAzul), nossa plataforma combina tecnologia de ponta com expertise contábil.

## 🚀 Funcionalidades

### 🏠 Site Principal
- **Design Moderno**: Interface elegante e responsiva inspirada no honest.com.br
- **Apresentação de Serviços**: Showcase completo dos serviços especializados
- **Preços Competitivos**: 40% mais econômico que a concorrência
- **Formulário de Contato**: Sistema integrado de comunicação

### 👥 Área do Cliente
- **Autenticação Segura**: Sistema de login e cadastro
- **Upload de Documentos**: Interface drag-and-drop para envio de arquivos
- **Gerenciamento de Documentos**: Visualização, download e exclusão
- **Sistema de Mensagens**: Comunicação direta com a equipe contábil
- **Dashboard Personalizado**: Visão geral das atividades

### 🔧 Área Administrativa
- **Gestão de Clientes**: Visualização e gerenciamento completo
- **Controle de Documentos**: Acesso a todos os documentos enviados
- **Sistema de Mensagens**: Resposta e gerenciamento de comunicações
- **Estatísticas**: Dashboard com métricas importantes
- **Controle de Acesso**: Sistema de permissões

## 🛠️ Tecnologias Utilizadas

### Backend
- **Flask**: Framework web Python
- **SQLAlchemy**: ORM para banco de dados
- **SQLite**: Banco de dados (desenvolvimento)
- **Flask-CORS**: Suporte a CORS
- **Werkzeug**: Utilitários web e segurança

### Frontend
- **HTML5/CSS3**: Estrutura e estilização
- **JavaScript Vanilla**: Interatividade
- **Design Responsivo**: Compatível com dispositivos móveis
- **Drag & Drop API**: Upload intuitivo de arquivos

### Especialidades Contábeis
Baseado em documentação real de especialidades:

1. **Serviços Contábeis**: Contabilidade geral, fiscal e tributário
2. **Abertura de Empresas**: Consultoria inicial e documentação
3. **Consultoria Tributária**: Planejamento estratégico e compliance
4. **Transfer Pricing**: Conformidade com regras brasileiras e OCDE
5. **Recursos Humanos**: Gestão de pessoal e relações trabalhistas
6. **Terceiro Setor**: Especialização em ONGs e OSCIPs
7. **Serviços Societários**: Alterações contratuais e societárias
8. **IRPJ**: Especialização em Imposto de Renda Pessoa Jurídica

## 📁 Estrutura do Projeto

```
contabplus/
├── src/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── client.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── client.py
│   │   └── admin.py
│   ├── static/
│   │   ├── index.html
│   │   ├── client.html
│   │   ├── admin.html
│   │   ├── styles.css
│   │   ├── script.js
│   │   ├── client.js
│   │   └── logo.png
│   └── main.py
├── venv/
├── uploads/
├── requirements.txt
└── README.md
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- Python 3.8+
- pip
- Git

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/fernandolisboaneto/Contabplus.git
cd Contabplus
```

2. **Crie e ative o ambiente virtual**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

3. **Instale as dependências**
```bash
pip install -r requirements.txt
```

4. **Configure o banco de dados**
```bash
cd src
python -c "from main import app, db; app.app_context().push(); db.create_all()"
```

5. **Crie um usuário admin (opcional)**
```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@contabplus.com","password":"admin123"}'
```

6. **Execute a aplicação**
```bash
python main.py
```

7. **Acesse a aplicação**
- Site principal: http://localhost:5000
- Área do cliente: http://localhost:5000/client
- Área administrativa: http://localhost:5000/admin

## 📊 API Endpoints

### Autenticação
- `POST /api/auth/register` - Cadastro de cliente
- `POST /api/auth/login` - Login de cliente
- `POST /api/auth/admin/login` - Login de admin
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Perfil do usuário

### Cliente
- `GET /api/client/documents` - Listar documentos
- `POST /api/client/documents/upload` - Upload de documento
- `GET /api/client/documents/{id}/download` - Download de documento
- `DELETE /api/client/documents/{id}` - Excluir documento
- `GET /api/client/messages` - Listar mensagens
- `POST /api/client/messages` - Enviar mensagem

### Admin
- `GET /api/admin/clients` - Listar clientes
- `GET /api/admin/clients/{id}` - Detalhes do cliente
- `GET /api/admin/messages` - Listar todas as mensagens
- `POST /api/admin/messages/{id}/reply` - Responder mensagem
- `GET /api/admin/stats` - Estatísticas do sistema

## 🎨 Design e UX

### Paleta de Cores
- **Primária**: #B8860B (Dourado)
- **Secundária**: #36454F (Cinza Escuro)
- **Accent**: #DAA520 (Dourado Claro)
- **Texto**: #2C3E50 (Azul Escuro)

### Tipografia
- **Títulos**: Playfair Display (serif)
- **Corpo**: Montserrat (sans-serif)

### Características
- Design responsivo e mobile-first
- Animações suaves e transições
- Interface intuitiva e acessível
- Componentes reutilizáveis

## 🔒 Segurança

- Autenticação baseada em sessões
- Hash de senhas com Werkzeug
- Validação de tipos de arquivo
- Proteção CORS configurada
- Sanitização de uploads

## 📈 Diferenciais Competitivos

1. **Preço**: 40% mais econômico que Contabilizei/Agilize
2. **Especialização**: Foco em nichos específicos (Transfer Pricing, Terceiro Setor)
3. **Tecnologia**: Plataforma moderna e intuitiva
4. **Atendimento**: Sistema integrado de comunicação
5. **Transparência**: Dashboard completo para clientes

## 🚀 Deploy

### PythonAnywhere
1. Faça upload dos arquivos
2. Configure o ambiente virtual
3. Ajuste as configurações de banco
4. Configure o WSGI

### Heroku
1. Crie um Procfile
2. Configure as variáveis de ambiente
3. Faça deploy via Git

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

**ContabPlus - Contabilidade Especializada**

- 📧 Email: contato@contabplus.com
- 🌐 Website: https://contabplus.com
- 📱 Telefone: (11) 9999-9999
- 📍 Endereço: São Paulo, SP

---

**Desenvolvido com ❤️ para revolucionar a contabilidade brasileira**

