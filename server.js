const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar dados de formulários e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir os arquivos estáticos (HTML, CSS, Imagens) da pasta atual
app.use(express.static(path.join(__dirname)));

// Banco de dados em memória para testes (reinicia ao reiniciar o servidor)
let bancoAgendamentos = [
    {
        nome: "Carlos Alberto Ferreira",
        servico: "Reformas Residenciais",
        data: "2026-06-18",
        endereco: "Av. Silva Jardim, Centro - Capanema",
        status: "Confirmado"
    },
    {
        nome: "Mariana de Souza",
        servico: "Pisos e Revestimentos",
        data: "2026-06-22",
        endereco: "Rua Mato Grosso, 450 - Bairro Novo",
        status: "Pendente"
    }
];

// Rota API para buscar todos os agendamentos (usada pela página de consultas)
app.get('/api/agendamentos', (req, res) => {
    res.json(bancoAgendamentos);
});

// Rota API para receber o formulário de agendamento
app.post('/api/agendamentos', (req, res) => {
    const { nome, telefone, endereco, data, servico, descricao } = req.body;

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
        status: "Pendente" // Todo agendamento novo começa como pendente
    };

    bancoAgendamentos.push(novoAgendamento);
    
    // Retorna sucesso para o front-end
    res.status(201).json({ message: "Agendamento solicitado com sucesso!" });
});

// Rota principal - Serve a index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`   Guimara Construção rodando em: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
