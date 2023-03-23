import path from 'node:path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineEventHandler(async (event) => {
    const { command } = event.context.params;

    let CommandsDir = path.join(__dirname, '../../commands');
    let cmd = (await import(CommandsDir + '/' + command + '.js')).default;
    if (!cmd.name || !cmd.description || !cmd.run)
    return console.log(
        'Unable to load command: ' + command + '. Reason: file is missing run / name / description properties.'
    );

    console.log('Command loaded: ' + command);
    return cmd;
})