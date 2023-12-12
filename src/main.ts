import { getBotKey, getContractConfig, setAnchorProvider } from './helpers';
import { startBot } from './bot';

const runBot = async () => {
    console.log('Running bot...');

    if (!(await getBotKey())) return;
    setAnchorProvider();
    await getContractConfig();
    await startBot();
}

runBot();