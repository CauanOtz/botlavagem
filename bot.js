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
            .setLabel('Digite o valor limpo (ex: 1000 ou 1000.50):')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('1000.50');

        const actionRow = new ActionRowBuilder().addComponents(valorInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        const valorTexto = interaction.fields.getTextInputValue('valor_input').replace(',', '.');
        const valorLimpo = parseFloat(valorTexto);
        
        if (isNaN(valorLimpo)) {
            await interaction.reply({ 
                content: 'Por favor, insira um valor válido!\nExemplos: 1000 ou 1000.50', 
                ephemeral: true 
            });
            return;
        }

        let resultado;
        let valorSujo;
        let valorMaquininha;
        
        if (interaction.customId === 'modal_com_parceria') {
            // Com parceria: 25% facção, 75% cliente
            valorSujo = valorLimpo / 0.75; // Valor original antes da lavagem (100%)
            const valorFaccao = valorLimpo * 0.25;
            valorMaquininha = valorFaccao * (5/25); // 5% da parte da facção
            const valorFuncionario = valorFaccao * (5/25);
            const valorFaccaoLiquido = valorFaccao - valorMaquininha - valorFuncionario;
            const valorCliente = valorLimpo * 0.75;

            resultado = {
                valorLimpo: valorLimpo,
                valorSujo: valorSujo,
                cliente: valorCliente,
                faccao: valorFaccaoLiquido,
                maquininha: valorMaquininha,
                funcionario: valorFuncionario
            };
        } else {
            // Sem parceria: 30% facção, 70% cliente
            valorSujo = valorLimpo / 0.70; // Valor original antes da lavagem (100%)
            const valorFaccao = valorLimpo * 0.30;
            valorMaquininha = valorFaccao * (5/30); // 5% da parte da facção
            const valorFuncionario = valorFaccao * (5/30);
            const valorFaccaoLiquido = valorFaccao - valorMaquininha - valorFuncionario;
            const valorCliente = valorLimpo * 0.70;

            resultado = {
                valorLimpo: valorLimpo,
                valorSujo: valorSujo,
                cliente: valorCliente,
                faccao: valorFaccaoLiquido,
                maquininha: valorMaquininha,
                funcionario: valorFuncionario
            };
        }

        const resposta = `**Relatório Detalhado da Lavagem**
💰 Valor Limpo (Após Lavagem): ${formatarDinheiro(resultado.valorLimpo)}
💸 Valor Sujo (Painel): ${formatarDinheiro(resultado.valorSujo)}
\n📊 **Distribuição:**
👤 Valor do Cliente: ${formatarDinheiro(resultado.cliente)}
🏢 Valor da Facção: ${formatarDinheiro(resultado.faccao)}
💳 Taxa Maquininha (5%): ${formatarDinheiro(resultado.maquininha)}
👷 Taxa Funcionário: ${formatarDinheiro(resultado.funcionario)}
\n📈 **Resumo:**
📉 Retirado do Painel: ${formatarDinheiro(resultado.valorSujo - resultado.valorLimpo)}
💱 Taxa de Lavagem: ${interaction.customId === 'modal_com_parceria' ? '25%' : '30%'}`;

        await interaction.reply({
            content: resposta,
            ephemeral: true
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
