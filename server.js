const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares obrigatórios para processar JSON e formulários
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir os ficheiros estáticos (HTML, CSS, Imagens) a partir da pasta raiz
app.use(express.static(path.join(__dirname)));

// ==========================================
// 1. BANCO DE DADOS EM MEMÓRIA - AGENDAMENTOS
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

// ==========================================
// 2. BANCO DE DADOS EM MEMÓRIA - FEEDBACKS (CLIENTES)
// ==========================================
let bancoFeedbacks = [
    {
        nome: "Maria Silva",
        cidade: "Capanema",
        mensagem: "Excelente profissional! Fez a reforma da minha casa com qualidade e no prazo.",
        data: "2026-05-10"
    },
    {
        nome: "João Mendes",
        cidade: "Capanema",
        mensagem: "Muito caprichoso e honesto. Recomendo para quem quer um bom pedreiro.",
        data: "2026-05-20"
    },
    {
        nome: "Ana Paula",
        cidade: "Capanema - PR",
        mensagem: "Trabalho impecável. Transformou minha cozinha completamente.",
        data: "2026-06-01"
    }
];

// ------------------------------------------
// ROTAS DE AGENDAMENTOS
// ------------------------------------------

// Obter todos os agendamentos (usado pela tela do Admin)
app.get('/api/agendamentos', (req, res) => {
    res.json(bancoAgendamentos);
});

// Obter apenas agendamentos com status 'Pendente'
app.get('/api/agendamentos/pendentes', (req, res) => {
    const pendentes = bancoAgendamentos.filter(item => item.status === 'Pendente');
    res.json(pendentes);
});

// Buscar um agendamento específico por telefone (usado pelo cliente)
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
    
    // Retorna todos os pedidos encontrados para aquele número
    res.json(encontrados);
});

// Receber novos agendamentos enviados pelo cliente
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
    
    // Insere no início da lista para visualização prioritária no Admin
    bancoAgendamentos.unshift(novoAgendamento); 
    res.status(201).json({ message: "Agendamento realizado com sucesso!", id: novoAgendamento.id, telefone: novoAgendamento.telefone });
});

// Atualizar status da obra
app.put('/api/agendamentos/status', (req, res) => {
    const { id, status } = req.body;
    const agendamento = bancoAgendamentos.find(item => item.id === id);
    if (agendamento) {
        agendamento.status = status;
        return res.json({ message: "Status atualizado com sucesso!" });
    }
    res.status(404).json({ error: "Agendamento não encontrado." });
});

// Remover ou cancelar agendamento
app.delete('/api/agendamentos/:id', (req, res) => {
    const id = req.params.id;
    const indice = bancoAgendamentos.findIndex(item => item.id === id);
    if (indice === -1) return res.status(404).json({ error: "Agendamento não encontrado." });
    bancoAgendamentos.splice(indice, 1);
    res.json({ message: "Agendamento removido com sucesso!" });
});

// ------------------------------------------
// ROTAS DE FEEDBACKS
// ------------------------------------------

app.get('/api/feedbacks', (req, res) => {
    res.json(bancoFeedbacks);
});

app.post('/api/feedbacks', (req, res) => {
    const { nome, cidade, mensagem } = req.body;

    if (!nome || !mensagem) {
        return res.status(400).json({ error: "Nome e mensagem são obrigatórios." });
    }

    const novoFeedback = {
        nome,
        cidade: cidade || "Capanema - PR",
        mensagem,
        data: new Date().toISOString().split('T')[0]
    };

    bancoFeedbacks.unshift(novoFeedback);
    res.status(201).json({ message: "Feedback enviado com sucesso!" });
});

// ------------------------------------------
// ROTAS DE RENDERIZAÇÃO DAS PÁGINAS (HTML)
// ------------------------------------------

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Inicialização do Servidor Local
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Guimara Construção operacional em: http://localhost:${PORT}`);
    console.log(` Acesse o Painel do Administrador em: http://localhost:${PORT}/admin`);
    console.log(`====================================================`);
});
