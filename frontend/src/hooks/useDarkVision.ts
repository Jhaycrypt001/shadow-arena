import { useState, useCallback } from 'react';
import { createInstance } from 'fhevmjs';
import { useWalletClient, usePublicClient } from 'wagmi';
import { darkGridABI } from '../abi';

// White pieces 1-6, Black pieces 7-12
const PIECE_MAP: Record<number, { type: string; color: 'w' | 'b' }> = {
  1:  { type: 'p', color: 'w' },
  2:  { type: 'r', color: 'w' },
  3:  { type: 'n', color: 'w' },
  4:  { type: 'b', color: 'w' },
  5:  { type: 'q', color: 'w' },
  6:  { type: 'k', color: 'w' },
  7:  { type: 'p', color: 'b' },
  8:  { type: 'r', color: 'b' },
  9:  { type: 'n', color: 'b' },
  10: { type: 'b', color: 'b' },
  11: { type: 'q', color: 'b' },
  12: { type: 'k', color: 'b' },
};

function indexToAlgebraic(i: number): string {
  const file = 'abcdefgh'[i % 8];
  const rank = 1 + Math.floor(i / 8);
  return `${file}${rank}`;
}

export function useDarkVision(contractAddress: string, matchId: string | null) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [decryptedBoard, setDecryptedBoard] = useState<Record<string, any>>({});
  const [isRevealing, setIsRevealing] = useState(false);

  const revealBoard = useCallback(async () => {
    if (!walletClient || !publicClient || !matchId) return;
    setIsRevealing(true);

    try {
      const chainId = await publicClient.getChainId();
      const rpcUrl = publicClient.chain?.rpcUrls.default.http[0] || "http://localhost:8545";

      // ─────────────────────────────────────────────────────────────────────
      // STEP 1: Create fhevmjs instance
      // ─────────────────────────────────────────────────────────────────────
      const instance = await createInstance({
        chainId,
        networkUrl: rpcUrl,
        gatewayUrl: "https://gateway.zama.ai/",
      } as any);

      // ─────────────────────────────────────────────────────────────────────
      // STEP 2: Generate keypair + EIP-712 token for this session
      //
      // generateKeypair() creates a throwaway keypair.
      // generateToken() creates an EIP-712 message tied to the contract.
      // We sign it to prove we own our wallet address.
      // ─────────────────────────────────────────────────────────────────────
      const { publicKey, privateKey } = (instance as any).generateKeypair();

      const { eip712 } = (instance as any).generateToken({
        verifyingContract: contractAddress,
        publicKey,
      });

      const signature = await walletClient.signTypedData({
        domain: eip712.domain,
        types: eip712.types,
        primaryType: eip712.primaryType,
        message: eip712.message,
      });

      // ─────────────────────────────────────────────────────────────────────
      // STEP 3: Fetch the ciphertext handles from the contract
      //
      // viewBoard() now returns bytes32[] — raw ciphertext handles.
      // These are NOT the decrypted values. They are references that the
      // Zama Gateway can decrypt for us given our signature.
      // ─────────────────────────────────────────────────────────────────────
      const handles = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: darkGridABI,
        functionName: 'viewBoard',
        args: [matchId],
      }) as `0x${string}`[];

      if (!handles || handles.length === 0) {
        console.warn("useDarkVision: viewBoard returned no handles");
        return;
      }

      // ─────────────────────────────────────────────────────────────────────
      // STEP 4: Decrypt all 64 handles via the Zama Gateway
      //
      // reencryptWithGateway (or equivalent) takes:
      //   - The ciphertext handles
      //   - Your publicKey (so gateway re-encrypts for you)
      //   - Your signature (proves you own the wallet that has ACL access)
      //   - The contract address (for ACL verification)
      //   - Your wallet address (the ACL entry to check)
      //
      // The gateway checks: "does walletAddress have FHE.allow() on this handle?"
      // If yes, it decrypts and re-encrypts under publicKey, returns to frontend.
      // Your privateKey then decrypts the result locally.
      // ─────────────────────────────────────────────────────────────────────

      // Filter out zero handles (empty squares) to avoid unnecessary gateway calls
      const nonZeroHandles = handles.filter(h => h && h !== '0x0000000000000000000000000000000000000000000000000000000000000000');

      if (nonZeroHandles.length === 0) {
        console.warn("useDarkVision: all handles are zero — board not set up yet");
        return;
      }

      // Decrypt all handles in one gateway call
      const decryptedValues: Record<string, bigint> = await (instance as any).reencryptWithGateway({
        handles: handles, // pass all 64, gateway ignores zero ones
        publicKey,
        privateKey,
        signature,
        contractAddress,
        userAddress: walletClient.account.address,
      });

      // ─────────────────────────────────────────────────────────────────────
      // STEP 5: Map decrypted values back to board squares
      // ─────────────────────────────────────────────────────────────────────
      const newBoardState: Record<string, any> = {};
      let pieceCount = 0;

      handles.forEach((handle, index) => {
        const decryptedValue = decryptedValues[handle];
        if (decryptedValue === undefined || decryptedValue === null) return;

        const pieceId = Number(decryptedValue);
        if (pieceId === 0) return; // empty square

        const piece = PIECE_MAP[pieceId];
        if (!piece) {
          console.warn(`useDarkVision: unknown piece id ${pieceId} at index ${index}`);
          return;
        }

        const square = indexToAlgebraic(index);
        newBoardState[square] = piece;
        pieceCount++;
      });

      console.log(`useDarkVision: mapped ${pieceCount} pieces onto board`);

      if (pieceCount > 0) {
        setDecryptedBoard(newBoardState);
      } else {
        console.warn("useDarkVision: 0 pieces after decryption — not updating board");
      }

    } catch (error: any) {
      console.error("useDarkVision revealBoard failed:", error?.message || error);
    } finally {
      setIsRevealing(false);
    }
  }, [walletClient, publicClient, contractAddress, matchId]);

  return { decryptedBoard, revealBoard, isRevealing };
}
