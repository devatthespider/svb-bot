import { checkEnv, contractConfig, getBotKey, getContractConfig, getGameInfo, setEnvironment } from './helpers';
import { buyKey, hasEnoughMoney, isGameOver, startBot } from './bot';

const runBot = async () => {
    console.log('Running bot...');

    if (!checkEnv()) return;
    if (!(await getBotKey())) return;
    setEnvironment();
    await getContractConfig();

    // BUY A KEY BEFORE STARTING THE BOT (CAN BE REMOVED)
    if (!(await hasEnoughMoney())) return;
    const {blocktimeEnd, lastBuyer} = await getGameInfo(contractConfig.gameIndex);
    if (isGameOver(blocktimeEnd, lastBuyer)) return;
    await buyKey(blocktimeEnd);
    //
    
    setTimeout(async() => {await startBot();}, 10_000);
}

runBot();