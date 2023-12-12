import { Connection, Keypair, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import fs from 'fs';
import base58 from "bs58";
import * as anchor from "@coral-xyz/anchor";
import { Contract, ContractConfig } from './models';
import { getOrCreateAssociatedTokenAccount, Account, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BorshCoder, Idl } from '@coral-xyz/anchor';
require('dotenv').config();

const IDL = JSON.parse(fs.readFileSync("./src/idl.json", "utf8"));
let CONNECTION;
let TOKEN;
let VERSION;
let VERSION_SEED;
export let PROGRAM_ID;
export let PROGRAM;

const findGameUserPdaAddress = (stringSeed, gameIndex: number, user: PublicKey) => {
    const gameUserSeed = Buffer.from(anchor.utils.bytes.utf8.encode(stringSeed));
    const gameIndexSeed = new anchor.BN(gameIndex).toBuffer('le', 4);
    const userSeed = user.toBuffer();
    const [pda, ] = anchor.web3.PublicKey.findProgramAddressSync(
        [gameUserSeed, gameIndexSeed, userSeed, VERSION_SEED], 
        new anchor.web3.PublicKey(PROGRAM_ID.toString()));
    return pda;
}

const findPdaAddressByStringSeeds = (seeds:string[], version: Buffer) => {
    const seedBuffers = seeds.map((seedString) => {
        return Buffer.from(anchor.utils.bytes.utf8.encode(seedString));
    });
    seedBuffers.push(version);
    const [pda, ] = anchor.web3.PublicKey.findProgramAddressSync(seedBuffers, new anchor.web3.PublicKey(PROGRAM_ID.toString()));
    const pdaAddress = new anchor.web3.PublicKey(pda);
    return pdaAddress;
}

const findRafflePdaAddress = (gameIndex: number) => {
    const raffleSeed = Buffer.from(anchor.utils.bytes.utf8.encode(process.env.RAFFLE_SEED));
    const gameIndexSeed = new anchor.BN(gameIndex).toBuffer('le', 4);
    const [pda, ] = anchor.web3.PublicKey.findProgramAddressSync(
        [raffleSeed, gameIndexSeed, VERSION_SEED], 
        new anchor.web3.PublicKey(PROGRAM_ID.toString()));
    return pda;
}

const getContractAddress = async (): Promise<PublicKey> => {
    return findPdaAddressByStringSeeds([process.env.CONTRACT_SEED], VERSION_SEED);
}

const getGameUserAddress = async (gameIndex: number, user: PublicKey): Promise<PublicKey> => {
    return findGameUserPdaAddress(process.env.GAME_USER_SEED, gameIndex, user);
}

const parseWhirlpoolData = (data: any, idl: Idl, object: string) => {
    const coder = new BorshCoder(idl);
    const ix = coder.accounts.decode(
      object,
      data
    );
    if(!ix) throw new Error("could not parse data");
    return ix;
};

export const buy = async () => {
    try {
        const memoInstruction = new TransactionInstruction({
            keys: [{ pubkey: contractConfig.botKeypair.publicKey, isSigner: true, isWritable: true }],
            data: Buffer.from(`${contractConfig.botKeypair.publicKey.toString()}-0-1-${process.env.VERSION}`, "utf-8"),
            programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
        });
        
        return await PROGRAM.methods
            .buy(contractConfig.gameIndex, 1)
            .accounts(
                {
                    authority: contractConfig.botKeypair.publicKey,
                    contract: contractConfig.contractAddress,
                    gameUser: contractConfig.gameUserAddress,
                    contractTokenAccount: contractConfig.contractTokenAccount.address,
                    buyerTokenAccount: contractConfig.buyerTokenAccount.address,
                    instructionSysvarAccount: new PublicKey("Sysvar1nstructions1111111111111111111111111"),
                    raffle: contractConfig.raffleAddress,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId
                })
            .remainingAccounts([
                { pubkey: new PublicKey('68Cj4MgS3KgRMwfKPbrPVekBNijNNg27Pu8F3bCRG2rX'), isWritable: true, isSigner: false },
                { pubkey: new PublicKey('F8FqZuUKfoy58aHLW6bfeEhfW9sTtJyqFTqnxVmGZ6dU'), isWritable: true, isSigner: false },
                { pubkey: new PublicKey('76JQzVkqHsWWXA3z4WvzzwnxVD4M1tFmFfp4NhnfcrUH'), isWritable: true, isSigner: false },
                { pubkey: new PublicKey('9dKYKpinYRdC21CYqAW2mwEpZuPwBN6wkoswsvpHXioA'), isWritable: true, isSigner: false },
                { pubkey: new PublicKey('9dKYKpinYRdC21CYqAW2mwEpZuPwBN6wkoswsvpHXioA'), isWritable: true, isSigner: false },
                { pubkey: new PublicKey('9dKYKpinYRdC21CYqAW2mwEpZuPwBN6wkoswsvpHXioA'), isWritable: true, isSigner: false },
                { pubkey: new PublicKey('86C3VW44St7Nrgd3vAkwJaQuFZWYWmKCr97sJHrHfEm5'), isWritable: true, isSigner: false },
                { pubkey: new PublicKey('DveZWxw2nBDSNdqPmUmZMaxniqobWkTZdBBjvQaE2Bjx'), isWritable: true, isSigner: false },
                { pubkey: new PublicKey('EefQxy3SUAHWN7bURnMZzXXyp3BNaD73QmaMn7Do1sAc'), isWritable: true, isSigner: false },
                { pubkey: new PublicKey('FrPSjSDWsRth6euNiaGAkzv6cYHgQysbWS9xMgkQcHXk'), isWritable: true, isSigner: false }
            ])
            .postInstructions([memoInstruction])
            .signers([contractConfig.botKeypair])    
            .rpc({skipPreflight: true});
    } catch (error) {
        console.log(`Error buying key: ${error}`);
    }
}

export const getTokenAccount = async (owner: PublicKey, payer: Keypair): Promise<Account> => {
    try {
        return await getOrCreateAssociatedTokenAccount(
            CONNECTION, 
            payer, 
            TOKEN, 
            owner,
            true
        );
    } catch (error) {
        console.log(`------- Error getting token account: ${error}`); 
    }
}

export let contractConfig: ContractConfig;

export const getBotKeypair = async () => {
    const keypairFile = fs.readFileSync("keys/id.json");
    return Keypair.fromSecretKey(Buffer.from(JSON.parse(keypairFile.toString())));
}

export const getContractConfig = async (): Promise<void> => {
    console.time('getContractConfig');

    // TODO: GET GAME INDEX ADDRESS DYNAMICALLY
    const gameIndex = Number(process.env.GAME_INDEX ?? 99);

    const botKeypair = await getBotKeypair();
    const contractAddress = await getContractAddress();
    const buyerTokenAccount = await getTokenAccount(botKeypair.publicKey, botKeypair);

    contractConfig = {
        botKeypair,
        contractAddress: contractAddress.toString(),
        gameUserAddress: (await getGameUserAddress(gameIndex, botKeypair.publicKey)).toString(),
        raffleAddress: findRafflePdaAddress(gameIndex).toString(),
        contractTokenAccount: await getTokenAccount(contractAddress, botKeypair),
        buyerTokenAccount,
        accountTokenAmount: Number(buyerTokenAccount.amount),
        gameIndex: gameIndex
    }
    console.timeEnd('getContractConfig');
}

export const refreshTokenAmount = async () => {
    const tokenAccount = await getTokenAccount(contractConfig.botKeypair.publicKey, contractConfig.botKeypair);
    contractConfig.accountTokenAmount = Number(tokenAccount.amount);
}

export const buildBotKeypair = (b58: string): string | null => {
    const secret = base58.decode(b58);
    const pair = Keypair.fromSecretKey(secret);
    
    if (pair.publicKey.toString()) {
        if (!fs.existsSync('./keys')) {
            fs.mkdirSync('./keys');
        }
        fs.writeFileSync(
          './keys/id.json',
          JSON.stringify(Array.from(secret))
        );
      return pair.publicKey.toString();
    }
    return null;
}

export const getGameInfo = async (gameIndex: number): Promise<{blocktimeEnd: number, lastBuyer: PublicKey}> => {
    console.time('getGameInfo');
    const datasizeFilter = {
        dataSize: 7215,
    };
    const options = {
        commitment: 'recent',
        encoding: 'base64',
        filter: [datasizeFilter],
        withContext: true
    };

    try {
        const account = await CONNECTION.getParsedAccountInfo(new PublicKey(contractConfig.contractAddress), options as any);
        const parsedAccount = parseWhirlpoolData(account.value.data, IDL as Idl, 'Contract') as Contract;
        const blocktimeEnd =  Number(parsedAccount.games[gameIndex].blocktimeEnd.toString());
        const lastBuyer = parsedAccount.games[gameIndex].winner;
        console.timeEnd('getGameInfo');
        return {blocktimeEnd, lastBuyer};
    } catch (error) {
        console.timeEnd('getGameInfo');
        return {blocktimeEnd: 0, lastBuyer: new PublicKey('11111111111111111111111111111111')};
    }
}

export const getBotKey = async (): Promise<boolean> => {
    try {
        if (process.env.BOT_KEY) {
            const address = buildBotKeypair(process.env.BOT_KEY);
            if (!address) {
                console.log('Error building bot keypair');
                return false;
            }
            console.log(`Bot address: ${address}`);
            return true;
        } else if (fs.existsSync('./keys/id.json')) {
            const keypair = await getBotKeypair();
            console.log(`Bot address: ${keypair.publicKey.toString()}`);
            return true;
        }
        console.log('No bot keypair found, check your .env file BOT_KEY argument or your key: "keys/id.json"');
    } catch (error) {
        console.log(`Error getting bot keypair: ${error} - check your .env file BOT_KEY argument or your key: "keys/id.json"`);
    }
    return false;
}

export const setEnvironment = async () => {
    const providerAnchor = anchor.AnchorProvider.env();
    anchor.setProvider(providerAnchor);
    PROGRAM_ID = new PublicKey(process.env.PROGRAM);
    PROGRAM = new anchor.Program(IDL, PROGRAM_ID);
    CONNECTION  = new Connection(process.env.ANCHOR_PROVIDER_URL);
    TOKEN = new PublicKey(process.env.BONK);
    VERSION = process.env.VERSION;
    VERSION_SEED = new anchor.BN(VERSION).toBuffer('le', 1);
}

export const checkEnv = (): boolean => {
    if (!fs.existsSync('.env')) {
        console.log('No .env file found, check example.env for reference and look at the readme.md file');
        return false;
    } else {
        if (!process.env.ANCHOR_PROVIDER_URL) {
            console.log('No ANCHOR_PROVIDER_URL found in .env file');
            return false;
        } else if (!process.env.BOT_KEY && !fs.existsSync('./keys/id.json')) {
            console.log('No BOT_KEY found in .env file or keys/id.json file');
            return false;
        }
    }
    return true;
}