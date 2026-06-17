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
// ROTAS DE AGENDAMENTOS (PROJETO COMPLETO)
// ------------------------------------------

// Obter todos os agendamentos (usado pela tela do Admin para listar as obras)
app.get('/api/agendamentos', (req, res) => {
    res.json(bancoAgendamentos);
});

// Buscar um agendamento específico por telefone (usado pelo cliente na consulta de status)
app.get('/api/agendamentos/buscar', (req, res) => {
    const telefoneBusca = req.query.telefone;
    if (!telefoneBusca) return res.status(400).json({ error: "Telefone não informado." });

    const telefoneLimpo = telefoneBusca.replace(/\D/g, '');
    const encontrado = bancoAgendamentos.find(item => {
        const itemTelLimpo = item.telefone ? item.telefone.replace(/\D/g, '') : '';
        return itemTelLimpo.includes(telefoneLimpo) || telefoneLimpo.includes(itemTelLimpo);
    });

    if (!encontrado) return res.status(404).json({ error: "Nenhum pedido localizado." });
    res.json(encontrado);
});

// Receber novos agendamentos enviados pelo formulário do cliente
app.post('/api/agendamentos', (req, res) => {
    const { nome, telefone, endereco, data, servico, descricao } = req.body;
    
    if (!nome || !telefone || !endereco || !data || !servico) {
        return res.status(400).json({ error: "Campos obrigatórios em falta." });
    }
    
    const novoAgendamento = {
        id: Date.now().toString(), // Gera um ID único baseado no timestamp
        nome, 
        telefone, 
        endereco, 
        data, 
        servico, 
        descricao: descricao || "", 
        status: "Pendente" // Todo agendamento entra inicialmente como Pendente
    };
    
    // Insere no início da lista para que o Admin veja o mais recente primeiro
    bancoAgendamentos.unshift(novoAgendamento); 
    res.status(201).json({ message: "Agendamento realizado com sucesso!", id: novoAgendamento.id });
});

// Atualizar status da obra (Aprovado, Confirmado, Concluído) via Admin
app.put('/api/agendamentos/status', (req, res) => {
    const { id, status } = req.body;
    const agendamento = bancoAgendamentos.find(item => item.id === id);
    if (agendamento) {
        agendamento.status = status;
        return res.json({ message: "Status atualizado com sucesso!" });
    }
    res.status(404).json({ error: "Agendamento não encontrado." });
});

// Remover ou cancelar um agendamento via painel Admin
app.delete('/api/agendamentos/:id', (req, res) => {
    const id = req.params.id;
    const indice = bancoAgendamentos.findIndex(item => item.id === id);
    if (indice === -1) return res.status(404).json({ error: "Agendamento não encontrado." });
    bancoAgendamentos.splice(indice, 1);
    res.json({ message: "Agendamento removido com sucesso!" });
});

// ------------------------------------------
// ROTAS DE FEEDBACKS (Aba Clientes)
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

// Rota raiz - Página Inicial do cliente
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Nova Rota Privada/Aba - Painel de Controle do Administrador
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
