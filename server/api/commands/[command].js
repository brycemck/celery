import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineEventHandler(async (event) => {
    const { command } = event.context.params;
    let CommandsDir = path.join(__dirname, '../../commands');
    let SoundsDir = path.join(__dirname, '../../public/sounds');
    let cmd;

    // determine if this is a command or a sound
    if (fs.existsSync(CommandsDir + '/' + command + '.js')) { // this is a command
        cmd = (await import(CommandsDir + '/' + command + '.js')).default;
        if (!cmd.name || !cmd.description || !cmd.run)
        return console.log(
            'Unable to load command: ' + command + '. Reason: file is missing run / name / description properties.'
        );
        console.log('Command loaded: ' + command);
    } else if (fs.existsSync(SoundsDir + '/' + command + '.mp3')) { // this is a sound
        cmd = { sound: true, path: SoundsDir + '/' + command + '.mp3' };
        console.log('Sound loaded: ' + command);
    } else { // file does not exist
        return console.log(
            'Unable to load command: ' + command + '. Reason: file is missing.'
        );
    }
    return cmd;
})