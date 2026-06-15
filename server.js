const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar dados de formulários e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir os ficheiros estáticos (HTML, CSS, Imagens) a partir da pasta raiz
app.use(express.static(path.join(__dirname)));

// Base de dados simulada em memória (reinicia quando o servidor for reiniciado)
let bancoAgendamentos = [
    {
        nome: "Carlos Alberto Ferreira",
        telefone: "(46) 99901-1111",
        servico: "Reformas Residenciais",
        data: "2026-06-18",
        endereco: "Av. Silva Jardim, Centro - Capanema",
        descricao: "Reforma completa do banheiro.",
        status: "Confirmado"
    },
    {
        nome: "Mariana de Souza",
        telefone: "(46) 99902-2222",
        servico: "Pisos e Revestimentos",
        data: "2026-06-22",
        endereco: "Rua Mato Grosso, 450 - Bairro Novo",
        descricao: "Colocação de porcelanato na sala.",
        status: "Pendente"
    },
    {
        nome: "Ricardo Oliveira Santos",
        telefone: "(46) 99903-3333",
        servico: "Alvenaria e Estruturas",
        data: "2026-06-25",
        endereco: "Linha São Cristóvão, Interior",
        descricao: "Levantar muro nos fundos do terreno.",
        status: "Concluído"
    }
];

// Rota 1: API para listar todos os agendamentos (usado em consultas.html)
app.get('/api/agendamentos', (req, res) => {
    res.json(bancoAgendamentos);
});

// Rota 2: API para buscar o status de um pedido específico pelo telefone (usado em status.html)
app.get('/api/agendamentos/buscar', (req, res) => {
    const telefoneBusca = req.query.telefone;

    if (!telefoneBusca) {
        return res.status(400).json({ error: "Telefone não informado." });
    }

    // Limpa os caracteres não numéricos para facilitar a comparação precisa
    const telefoneLimpo = telefoneBusca.replace(/\D/g, '');

    if (telefoneLimpo === '') {
        return res.status(400).json({ error: "Telefone inválido." });
    }

    // Procura o agendamento correspondente na nossa lista
    const agendamentoEncontrado = bancoAgendamentos.find(item => {
        const itemTelLimpo = item.telefone ? item.telefone.replace(/\D/g, '') : '';
        return itemTelLimpo.includes(telefoneLimpo) || telefoneLimpo.includes(itemTelLimpo);
    });

    if (!agendamentoEncontrado) {
        return res.status(404).json({ error: "Nenhum pedido encontrado para este telefone." });
    }

    res.json(agendamentoEncontrado);
});

// Rota 3: API para receber e registar novos agendamentos (usado em agendamento.html)
app.post('/api/agendamentos', (req, res) => {
    const { nome, telefone, endereco, data, servico, descricao } = req.body;

    // Validação básica dos campos obrigatórios
    if (!nome || !telefone || !endereco || !data || !servico) {
        return res.status(400).json({ error: "Por favor, preencha todos os campos obrigatórios." });
    }

    const novoAgendamento = {
        nome,
        telefone,
        endereco,
        data,
        servico,
        descricao: descricao || "",
        status: "Pendente" // Todo pedido novo inicia como Pendente por padrão
    };

    bancoAgendamentos.push(novoAgendamento);
    res.status(201).json({ message: "Agendamento solicitado com sucesso!" });
});

// Rota principal: Serve o arquivo index.html na raiz do site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicialização do Servidor Node.js
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`   Guimara Construção operacional em: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
