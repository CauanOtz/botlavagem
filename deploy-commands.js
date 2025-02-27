const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    {
        name: 'lavar',
        description: 'Calcular valores de lavagem de dinheiro'
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registrando comandos...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Comandos registrados com sucesso!');
    } catch (error) {
        console.error(error);
    }
})();
