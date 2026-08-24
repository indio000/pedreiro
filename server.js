const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares obrigatórios para processar JSON e formulários
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir os ficheiros estáticos a partir da pasta raiz
app.use(express.static(path.join(__dirname)));

// ==========================================
// 1. BANCO DE DADOS EM MEMÓRIA
// ==========================================
let bancoAgendamentos = [
    {
        id: "1",
        nome: "Carlos Alberto Ferreira",
        telefone: "(46) 99901-1111",
        servico: "Reformas Residenciais",
        data: "2026-06-18",
        endereco: "Av. Silva Jardim, Centro - Capanema",
        descricao: "Reforma completa do banheiro.",
        status: "Confirmado"
    },
    {
        id: "2",
        nome: "Mariana de Souza",
        telefone: "(46) 99902-2222",
        servico: "Pisos e Revestimentos",
        data: "2026-06-22",
        endereco: "Rua Mato Grosso, 450 - Bairro Novo",
        descricao: "Colocação de porcelanato na sala.",
        status: "Pendente"
    }
];

let bancoFeedbacks = [
    {
        nome: "Maria Silva",
        cidade: "Capanema",
        mensagem: "Excelente profissional! Fez a reforma da minha casa com qualidade e no prazo.",
        estrelas: 5,
        data: "2026-05-10"
    }
];

// ==========================================
// 2. SISTEMA DE AUTENTICAÇÃO / SESSÃO (ADMIN)
// ==========================================
const SENHA_ADMIN = "1234";
const sessoesAtivas = new Set();

function parseCookies(req) {
    const list = {};
    const rc = req.headers.cookie;
    if (rc) {
        rc.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }
    return list;
}

function verificarAutenticacao(req, res, next) {
    const cookies = parseCookies(req);
    const sessionToken = cookies.admin_session;

    if (sessionToken && sessoesAtivas.has(sessionToken)) {
        return next();
    }
    
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: "Não autorizado. Faça login primeiro." });
    }
    
    res.redirect('/admin');
}

// Login
app.post('/api/admin/login', (req, res) => {
    const { senha } = req.body;

    if (senha === SENHA_ADMIN) {
        const tokenSession = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessoesAtivas.add(tokenSession);

        res.setHeader('Set-Cookie', `admin_session=${tokenSession}; Path=/; HttpOnly; Max-Age=7200`);
        return res.json({ ok: true, message: "Login realizado com sucesso!" });
    }

    res.status(401).json({ error: "Senha incorreta!" });
});

// Logout
app.post('/api/admin/logout', (req, res) => {
    const cookies = parseCookies(req);
    if (cookies.admin_session) {
        sessoesAtivas.delete(cookies.admin_session);
    }
    res.setHeader('Set-Cookie', 'admin_session=; Path=/; HttpOnly; Max-Age=0');
    res.json({ ok: true, message: "Logout realizado com sucesso." });
});

// Checar sessão
app.get('/api/admin/check-session', (req, res) => {
    const cookies = parseCookies(req);
    const autenticado = cookies.admin_session && sessoesAtivas.has(cookies.admin_session);
    res.json({ autenticado: !!autenticado });
});

// ------------------------------------------
// ROTAS DE AGENDAMENTOS
// ------------------------------------------

// Obter todos os agendamentos (Protegido)
app.get('/api/agendamentos', verificarAutenticacao, (req, res) => {
    res.json(bancoAgendamentos);
});

// Obter apenas pendentes (Protegido)
app.get('/api/agendamentos/pendentes', verificarAutenticacao, (req, res) => {
    const pendentes = bancoAgendamentos.filter(item => item.status === 'Pendente');
    res.json(pendentes);
});

// Buscar por telefone (Público - Status do Cliente)
app.get('/api/agendamentos/buscar', (req, res) => {
    const telefoneBusca = req.query.telefone;
    if (!telefoneBusca) return res.status(400).json({ error: "Telefone não informado." });

    const telefoneLimpo = telefoneBusca.replace(/\D/g, '');
    const encontrados = bancoAgendamentos.filter(item => {
        const itemTelLimpo = item.telefone ? item.telefone.replace(/\D/g, '') : '';
        return itemTelLimpo.includes(telefoneLimpo) || telefoneLimpo.includes(itemTelLimpo);
    });

    if (!encontrados || encontrados.length === 0) {
        return res.status(404).json({ error: "Nenhum pedido localizado para este número." });
    }
    
    res.json(encontrados);
});

// Criar agendamento (Público)
app.post('/api/agendamentos', (req, res) => {
    const { nome, telefone, endereco, data, servico, descricao } = req.body;
    
    if (!nome || !telefone || !endereco || !data || !servico) {
        return res.status(400).json({ error: "Campos obrigatórios em falta." });
    }
    
    const novoAgendamento = {
        id: Date.now().toString(),
        nome, 
        telefone, 
        endereco, 
        data, 
        servico, 
        descricao: descricao || "", 
        status: "Pendente"
    };
    
    bancoAgendamentos.unshift(novoAgendamento); 
    res.status(201).json({ message: "Agendamento realizado com sucesso!", id: novoAgendamento.id, telefone: novoAgendamento.telefone });
});

// Editar agendamento pelo Cliente (Público)
app.put('/api/agendamentos/cliente/:id', (req, res) => {
    const id = req.params.id;
    const { nome, servico, data, endereco, descricao } = req.body;
    
    const agendamento = bancoAgendamentos.find(item => item.id === id);
    if (!agendamento) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    if (nome) agendamento.nome = nome;
    if (servico) agendamento.servico = servico;
    if (data) agendamento.data = data;
    if (endereco) agendamento.endereco = endereco;
    if (descricao !== undefined) agendamento.descricao = descricao;

    res.json({ message: "Agendamento atualizado com sucesso!", agendamento });
});

// Atualizar status pelo Admin (Protegido)
app.put('/api/agendamentos/status', verificarAutenticacao, (req, res) => {
    const { id, status } = req.body;
    const agendamento = bancoAgendamentos.find(item => item.id === id);
    if (agendamento) {
        agendamento.status = status;
        return res.json({ message: "Status atualizado com sucesso!" });
    }
    res.status(404).json({ error: "Agendamento não encontrado." });
});

// Deletar pelo Admin (Protegido)
app.delete('/api/agendamentos/:id', verificarAutenticacao, (req, res) => {
    const id = req.params.id;
    const indice = bancoAgendamentos.findIndex(item => item.id === id);
    if (indice === -1) return res.status(404).json({ error: "Agendamento não encontrado." });
    bancoAgendamentos.splice(indice, 1);
    res.json({ message: "Agendamento removido com sucesso!" });
});

// Cancelar agendamento diretamente pelo Cliente (Público)
app.delete('/api/agendamentos/cliente/:id', (req, res) => {
    const id = req.params.id;
    const indice = bancoAgendamentos.findIndex(item => item.id === id);
    if (indice === -1) return res.status(404).json({ error: "Agendamento não encontrado." });
    bancoAgendamentos.splice(indice, 1);
    res.json({ message: "Agendamento cancelado com sucesso!" });
});

// ------------------------------------------
// ROTAS DE FEEDBACKS
// ------------------------------------------
app.get('/api/feedbacks', (req, res) => {
    res.json(bancoFeedbacks);
});

app.post('/api/feedbacks', (req, res) => {
    const { nome, cidade, mensagem, estrelas } = req.body;

    if (!nome || !mensagem) {
        return res.status(400).json({ error: "Nome e mensagem são obrigatórios." });
    }

    const valorEstrelas = parseInt(estrelas);
    const estrelasValidadas = (!isNaN(valorEstrelas) && valorEstrelas >= 1 && valorEstrelas <= 5) ? valorEstrelas : 5;

    const novoFeedback = {
        nome,
        cidade: cidade || "Capanema - PR",
        mensagem,
        estrelas: estrelasValidadas,
        data: new Date().toISOString().split('T')[0]
    };

    bancoFeedbacks.unshift(novoFeedback);
    res.status(201).json({ message: "Feedback enviado com sucesso!" });
});

// ------------------------------------------
// ROTAS DE PÁGINAS
// ------------------------------------------
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Guimara Construção operacional em: http://localhost:${PORT}`);
    console.log(` Acesse o Painel do Administrador em: http://localhost:${PORT}/admin`);
    console.log(`====================================================`);
});
