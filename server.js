// ... [Mantenha os middlewares e as rotas GET e POST anteriores obtidas no passo anterior] ...

// Rota Nova 4: API para Atualizar o Status (Ações do Admin de aprovar ou concluir)
app.put('/api/agendamentos/status', (req, res) => {
    const { index, status } = req.body;

    if (index === undefined || !status) {
        return res.status(400).json({ error: "Dados incompletos para atualização." });
    }

    if (bancoAgendamentos[index]) {
        bancoAgendamentos[index].status = status;
        return res.json({ message: `Status alterado para ${status} com sucesso!` });
    } else {
        return res.status(404).json({ error: "Agendamento não localizado." });
    }
});

// Rota Nova 5: API para Deletar um registro (Ação do Admin de excluir da lista)
app.delete('/api/agendamentos/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);

    if (isNaN(index) || index < 0 || index >= bancoAgendamentos.length) {
        return res.status(404).json({ error: "Registro não encontrado para exclusão." });
    }

    // Remove do array na memória
    bancoAgendamentos.splice(index, 1);
    res.json({ message: "Agendamento excluído com sucesso do sistema." });
});

// Iniciar o Servidor
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`   Guimara Construção operacional em: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
