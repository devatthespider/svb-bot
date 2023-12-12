import { checkEnv, getBotKey, getContractConfig, setEnvironment } from './helpers';
import { startBot } from './bot';

const runBot = async () => {
    console.log('Running bot...');

    if (!checkEnv()) return;
    if (!(await getBotKey())) return;
    setEnvironment();
    await getContractConfig();
    await startBot();
}

runBot();