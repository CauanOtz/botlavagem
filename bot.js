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
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        const modal = new ModalBuilder()
            .setCustomId(interaction.customId === 'com_parceria' ? 'modal_com_parceria' : 'modal_sem_parceria')
            .setTitle('Valor para Lavagem');

        const valorInput = new TextInputBuilder()
            .setCustomId('valor_input')
            .setLabel('Digite o valor a ser lavado:')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(valorInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        const valor = parseFloat(interaction.fields.getTextInputValue('valor_input'));
        
        if (isNaN(valor)) {
            await interaction.reply('Por favor, insira um valor válido!');
            return;
        }

        let resultado;
        if (interaction.customId === 'modal_com_parceria') {
            // Com parceria: 25% facção, 75% cliente
            const valorFaccao = valor * 0.25;
            const valorMaquininha = valorFaccao * (5/25); // 5% do valor da facção
            const valorFuncionario = valorFaccao * (5/25); // 5% do valor da facção
            const valorFaccaoLiquido = valorFaccao - valorMaquininha - valorFuncionario;
            const valorCliente = valor * 0.75;

            resultado = {
                total: valor,
                cliente: valorCliente,
                faccao: valorFaccaoLiquido,
                maquininha: valorMaquininha,
                funcionario: valorFuncionario
            };
        } else {
            // Sem parceria: 30% facção, 70% cliente
            const valorFaccao = valor * 0.30;
            const valorMaquininha = valorFaccao * (5/30); // 5% do valor da facção
            const valorFuncionario = valorFaccao * (5/30); // 5% do valor da facção
            const valorFaccaoLiquido = valorFaccao - valorMaquininha - valorFuncionario;
            const valorCliente = valor * 0.70;

            resultado = {
                total: valor,
                cliente: valorCliente,
                faccao: valorFaccaoLiquido,
                maquininha: valorMaquininha,
                funcionario: valorFuncionario
            };
        }

        const resposta = `**Resultado da Lavagem**
Valor Total: $${resultado.total.toFixed(2)}
Valor do Cliente: $${resultado.cliente.toFixed(2)}
Valor da Facção: $${resultado.faccao.toFixed(2)}
Valor da Maquininha: $${resultado.maquininha.toFixed(2)}
Valor do Funcionário: $${resultado.funcionario.toFixed(2)}`;

        await interaction.reply({
            content: resposta,
            ephemeral: true
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
