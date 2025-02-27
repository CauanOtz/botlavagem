const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
require('dotenv').config();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log('Bot está online!');
});

// Novo handler para mensagens normais
client.on('messageCreate', async message => {
    if (message.content === '!lavar') {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('com_parceria')
                    .setLabel('Com Parceria')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('sem_parceria')
                    .setLabel('Sem Parceria')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.reply({
            content: 'Selecione o tipo de lavagem:',
            components: [row]
        });
    }
    
    if (message.content.startsWith('!relatorio')) {
        const linhas = message.content.split('\n');
        if (linhas.length < 3) {
            await message.reply('Por favor, forneça os valores no formato:\n!relatorio\nValor Lavado\nValor Painel\nValor Pago');
            return;
        }

        const valorLavado = parseFloat(linhas[1].replace(/[^\d.-]/g, ''));
        const valorPainel = parseFloat(linhas[2].replace(/[^\d.-]/g, ''));
        const valorPago = parseFloat(linhas[3].replace(/[^\d.-]/g, ''));

        if (isNaN(valorLavado) || isNaN(valorPainel) || isNaN(valorPago)) {
            await message.reply('Por favor, forneça valores numéricos válidos.');
            return;
        }

        const lucro = valorLavado - valorPago;
        const diferenca = valorLavado - valorPainel;

        const resposta = `**Relatório de Lavagem**
💰 Valor Lavado: ${formatarDinheiro(valorLavado)}
📊 Valor Painel: ${formatarDinheiro(valorPainel)}
💸 Valor Pago: ${formatarDinheiro(valorPago)}
\n📈 **Resultados:**
💵 Lucro: ${formatarDinheiro(lucro)}
📉 Diferença Painel: ${formatarDinheiro(diferenca)}`;

        await message.reply(resposta);
    }
});

// Função para formatar números no estilo brasileiro
function formatarDinheiro(valor) {
    return valor.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        const modal = new ModalBuilder()
            .setCustomId(interaction.customId === 'com_parceria' ? 'modal_com_parceria' : 'modal_sem_parceria')
            .setTitle('Valor para Lavagem');

        const valorInput = new TextInputBuilder()
            .setCustomId('valor_input')
            .setLabel('Digite o valor do painel:')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('1000000');

        const actionRow = new ActionRowBuilder().addComponents(valorInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        const valorTexto = interaction.fields.getTextInputValue('valor_input').replace(',', '.');
        const valorPainel = parseFloat(valorTexto);
        
        if (isNaN(valorPainel)) {
            await interaction.reply({ 
                content: 'Por favor, insira um valor válido!\nExemplos: 1000000', 
                ephemeral: true 
            });
            return;
        }

        // Calcula o valor após descontar taxas de maquininha e funcionário
        const valorMaquininha = valorPainel * 0.05;
        const valorFuncionario = valorPainel * 0.05;
        const valorAposDescontos = valorPainel - valorMaquininha - valorFuncionario;

        let resultado;
        
        if (interaction.customId === 'modal_com_parceria') {
            // Com parceria: 75% cliente, 15% facção
            const valorCliente = valorAposDescontos * 0.75;
            const valorFaccao = valorAposDescontos * 0.15;

            resultado = {
                valorPainel: valorPainel,
                valorAposDescontos: valorAposDescontos,
                cliente: valorCliente,
                faccao: valorFaccao,
                maquininha: valorMaquininha,
                funcionario: valorFuncionario,
                taxaLavagem: "15%"
            };
        } else {
            // Sem parceria: 70% cliente, 20% facção
            const valorCliente = valorAposDescontos * 0.70;
            const valorFaccao = valorAposDescontos * 0.20;

            resultado = {
                valorPainel: valorPainel,
                valorAposDescontos: valorAposDescontos,
                cliente: valorCliente,
                faccao: valorFaccao,
                maquininha: valorMaquininha,
                funcionario: valorFuncionario,
                taxaLavagem: "20%"
            };
        }

        const resposta = `**Relatório de Lavagem** ${interaction.customId === 'modal_com_parceria' ? '(Com Parceria)' : '(Sem Parceria)'}
💸 **Valor do Painel:** ${formatarDinheiro(resultado.valorPainel)}
💰 **Valor Após Taxas:** ${formatarDinheiro(resultado.valorAposDescontos)}

📊 **Distribuição:**
\`\`\`
┌─────────────┬────────────────┬─────────┐
│   Destino   │    Valor      │   (%)   │
├─────────────┼────────────────┼─────────┤
│ Cliente     │ ${formatarDinheiro(resultado.cliente).padEnd(12)} │   ${interaction.customId === 'modal_com_parceria' ? '75%' : '70%'}   │
│ Facção      │ ${formatarDinheiro(resultado.faccao).padEnd(12)} │   ${resultado.taxaLavagem.padStart(3)}   │
│ Maquininha  │ ${formatarDinheiro(resultado.maquininha).padEnd(12)} │    5%   │
│ Funcionário │ ${formatarDinheiro(resultado.funcionario).padEnd(12)} │    5%   │
└─────────────┴────────────────┴─────────┘
\`\`\`
💳 **Taxas Descontadas:** ${formatarDinheiro(resultado.maquininha + resultado.funcionario)} (10%)
💰 **Total:** ${formatarDinheiro(resultado.valorPainel)}`;

        await interaction.reply({
            content: resposta,
            ephemeral: true
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
