import { Keypair, PublicKey } from "@solana/web3.js";
import { Account } from '@solana/spl-token';
import { BN } from "@coral-xyz/anchor";

export interface ContractConfig {
    botKeypair: Keypair;
    contractAddress: string;
    gameUserAddress: string;
    contractTokenAccount: Account;
    buyerTokenAccount: Account;
    raffleAddress: string;
    gameIndex: number;
    accountTokenAmount: number;
}

export interface Contract {
    activeGameIndex: number;
    bump: number;
    games: Game[];
    version: number;
    autoStartNextGame: boolean;
}

export interface Game {
    winner: PublicKey;
    keysPurchased: number;
    revShareTotal: BN;
    winnerTotal: BN;
    blocktimeStart: BN;
    blocktimeEnd: BN;
}

export interface GameUser {
    gameIndex: number;
    qty: number;
    claimedAmount: BN;
    authority: PublicKey;
    bump: number;
    version: number;
}