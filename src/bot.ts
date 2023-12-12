import { PublicKey } from "@solana/web3.js";
import { buy, contractConfig, getGameInfo, getTokenAccount, refreshTokenAmount } from "./helpers";

const runEvery = process.env.RUN_INTERVAL ? Number(process.env.RUN_INTERVAL) : 10000;
const pricePerKey = Number(process.env.PRICE_PER_KEY) * (10 ** Number(process.env.DECIMALS));

const isGameOver = (blocktimeEnd: number, lastBuyer: PublicKey) => {
    const currentTime = new Date().getTime();
    const mstoEnd = (blocktimeEnd * 1000) - currentTime;
    if (mstoEnd < -60000 && blocktimeEnd != 0) {
        console.log(`Game is over, winner: ${lastBuyer.toString()}`);
        return true;
    } 
    return false;
}

const hasEnoughMoney = async () => {
    if (contractConfig.accountTokenAmount < pricePerKey) {
        const tokenAccount = await getTokenAccount(contractConfig.botKeypair.publicKey, contractConfig.botKeypair);
        contractConfig.accountTokenAmount = Number(tokenAccount.amount);
        if (contractConfig.accountTokenAmount < pricePerKey) {
            console.log(`Not enough token to buy keys ${contractConfig.accountTokenAmount / (10 ** 5)} BONK left.`);
            return false;
        }
    }
    return true;
}

const shouldBuy = (lastBuyer: PublicKey, blocktimeEnd: number) => {
    const currentTime = new Date().getTime();
    const mstoEnd = (blocktimeEnd * 1000) - currentTime;
    if (lastBuyer.toString() != contractConfig.botKeypair.publicKey.toString() && mstoEnd > 0 && mstoEnd < runEvery) return true;
    const now = new Date().toLocaleTimeString();
    const next = (mstoEnd - runEvery) / 1000;
    console.log(`${now}: Didnt buy ${mstoEnd}ms before the end. Checking in: ${next} seconds.`);
    return false;
}

const buyKey = async (blocktimeEnd: number) => {
    console.time('buyKey');
    const currentTime = new Date().getTime();
    const mstoEnd = (blocktimeEnd * 1000) - currentTime;
    let signature;
    try {
        signature = await buy();
        if (!signature) {
            signature = await buy();
        }
    } catch (error) {
        console.log(`Error buying key: ${error}`);
        signature = await buy();
    }
    console.timeEnd('buyKey');
    const time = new Date().toLocaleTimeString();
    console.log(`${time}: Bought a key ${mstoEnd / 1000} seconds before the end - ${signature}`);
}

export const startBot = async (): Promise<void> => {
    try {
        const {blocktimeEnd, lastBuyer} = await getGameInfo(contractConfig.gameIndex);
        if (isGameOver(blocktimeEnd, lastBuyer)) return;
        if (!(await hasEnoughMoney())) return;
        if (shouldBuy(lastBuyer, blocktimeEnd)) {
            await buyKey(blocktimeEnd);
            setTimeout(() => {startBot();}, 40_000 - runEvery);
            await refreshTokenAmount();
        } else {
            const currentTime = new Date().getTime();
            const mstoEnd = (blocktimeEnd * 1000) - currentTime;
            setTimeout(() => {startBot();}, mstoEnd - runEvery);
        }
    } catch (error) {
        console.log(`Error in startBot: ${error}`);
        return;
    }
}