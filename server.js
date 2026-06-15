const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares obrigatórios para processar JSON e formulários
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir os ficheiros estáticos (HTML, CSS, Imagens) a partir da pasta raiz
app.use(express.static(path.join(__dirname)));

// Base de dados simulada em memória com ID único para evitar erros de índice ao eliminar
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
    },
    {
        id: "3",
        nome: "Ricardo Oliveira Santos",
        telefone: "(46) 99903-3333",
        servico: "Alvenaria e Estruturas",
        data: "2026-06-25",
        endereco: "Linha São Cristóvão, Interior",
        descricao: "Levantar muro nos fundos do terreno.",
        status: "Concluído"
    }
];

// Rota 1: Listar todos os agendamentos (Consultas e Admin)
app.get('/api/agendamentos', (req, res) => {
    res.json(bancoAgendamentos);
});

// Rota 2: Buscar status por telefone (status.html)
app.get('/api/agendamentos/buscar', (req, res) => {
    const telefoneBusca = req.query.telefone;
    if (!telefoneBusca) {
        return res.status(400).json({ error: "Telefone não informado." });
    }

    const telefoneLimpo = telefoneBusca.replace(/\D/g, '');
    if (telefoneLimpo === '') {
        return res.status(400).json({ error: "Telefone inválido." });
    }

    const encontrado = bancoAgendamentos.find(item => {
        const itemTelLimpo = item.telefone ? item.telefone.replace(/\D/g, '') : '';
        return itemTelLimpo.includes(telefoneLimpo) || telefoneLimpo.includes(itemTelLimpo);
    });

    if (!encontrado) {
        return res.status(404).json({ error: "Nenhum pedido localizado." });
    }
    res.json(encontrado);
});

// Rota 3: Criar novo agendamento (agendamento.html)
app.post('/api/agendamentos', (req, res) => {
    const { nome, telefone, endereco, data, servico, descricao } = req.body;

    if (!nome || !telefone || !endereco || !data || !servico) {
        return res.status(400).json({ error: "Campos obrigatórios em falta." });
    }

    const novoAgendamento = {
        id: Date.now().toString(), // Gera um ID único baseado no tempo atual
        nome,
        telefone,
        endereco,
        data,
        servico,
        descricao: descricao || "",
        status: "Pendente"
    };

    bancoAgendamentos.push(novoAgendamento);
    res.status(201).json({ message: "Sucesso!" });
});

// Rota 4: Atualizar Status do Pedido (admin.html)
app.put('/api/agendamentos/status', (req, res) => {
    const { id, status } = req.body;

    const agendamento = bancoAgendamentos.find(item => item.id === id);
    
    if (agendamento) {
        agendamento.status = status;
        return res.json({ message: "Status atualizado com sucesso!" });
    } else {
        return res.status(404).json({ error: "Agendamento não encontrado." });
    }
});

// Rota 5: Eliminar um agendamento (admin.html)
app.delete('/api/agendamentos/:id', (req, res) => {
    const id = req.params.id;
    const indice = bancoAgendamentos.findIndex(item => item.id === id);

    if (indice === -1) {
        return res.status(404).json({ error: "Registro não encontrado." });
    }

    bancoAgendamentos.splice(indice, 1);
    res.json({ message: "Removido com sucesso." });
});

// Rota raiz para abrir o site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicialização
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`   Guimara Construção operacional em: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
