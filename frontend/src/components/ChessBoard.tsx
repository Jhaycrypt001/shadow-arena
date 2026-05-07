import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { PieceSymbol, Color } from 'chess.js';
import { useDarkVision } from '../hooks/useDarkVision';
import { Button } from './ui/button';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, usePublicClient } from 'wagmi';
import { darkGridABI } from '../abi';

const PieceIcon = ({ type, color }: { type: PieceSymbol; color: Color }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#FFFFFF' : '#a855f7';
  const pieces: Record<PieceSymbol, React.ReactNode> = {
    p: <path d="M12 20c-1.1 0-2-.9-2-2 0-.36.1-.7.27-1h3.46c.17.3.27.64.27 1 0 1.1-.9 2-2 2zM11 6v7h2V6h-2z" fill={fill} />,
    r: <path d="M19 19H5v-2h14v2zM5 15h2v-4H5v4zm12-4v4h2v-4h-2zM7 11V7h2v4H7zm4 0V7h2v4h-2zm4 0V7h2v4h-2zM19 5H5v2h14V5z" fill={fill} />,
    n: <path d="M15 3c-2.76 0-5 2.24-5 5 0 .91.25 1.77.68 2.5L7 17h10l-1.5-3.5c.95-.56 1.78-1.34 2.4-2.26.68-.99 1.1-2.18 1.1-3.24 0-2.76-2.24-5-5-5z" fill={fill} />,
    b: <path d="M12 2C9 2 7 4 7 7c0 2 1 3 2 4.5V18h6v-6.5c1-1.5 2-2.5 2-4.5 0-3-2-5-5-5zM11 4h2v2h-2V4z" fill={fill} />,
    q: <path d="M18 3l-2 3-2-3-2 3-2-3-2 3-2-3v11h14V3zM5 16h14v2H5v-2z" fill={fill} />,
    k: <path d="M12 2L10 5H7v2h3v3h2v-3h3V5h-3L12 2zM5 12h14v2H5v-2zm0 4h14v2H5v-2z" fill={fill} />,
  };
  return <svg viewBox="0 0 24 24" className="w-4/5 h-4/5 drop-shadow-[0_0_8px_rgba(147,51,234,0.3)]">{pieces[type]}</svg>;
};

function algebraicToIndex(square: string): number {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  return rank * 8 + file;
}

function generateArenaCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export function ChessBoard() {
  const CONTRACT_ADDRESS = "0xEb43CAe742707199d9521A789E1376F36C1dA703";
  const { address } = useAccount();
  const publicClient = usePublicClient(); 

  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<string[]>([]);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [joinInput, setJoinInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [pendingCreateId, setPendingCreateId] = useState<string | null>(null);
  const [localWhiteTime, setLocalWhiteTime] = useState(180);
  const [localBlackTime, setLocalBlackTime] = useState(180);

  // 🔴 DEMO SAVER STATES: Local Memory to defeat RPC Cache
  const [localRole, setLocalRole] = useState<'white' | 'black' | null>(null);
  const [godMode, setGodMode] = useState(false);

  const lastBoardHashRef = useRef<string>('');
  const initialBoardLoadedRef = useRef(false);

  const { data: myUsername, isLoading: isUsernameLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: darkGridABI,
    functionName: 'getUsername',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: matchInfo, refetch: refetchMatchInfo } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: darkGridABI,
    functionName: 'getMatchInfo',
    args: currentMatchId ? [currentMatchId] : undefined as any,
    query: { enabled: !!currentMatchId, refetchInterval: 2000, staleTime: 0 }
  });

  const playerWhite = matchInfo?.[0];
  const playerBlack = matchInfo?.[1];
  
  // If God Mode is triggered, force the UI to act like the game is fully active
  const isGameActive = godMode ? true : (matchInfo?.[2] ?? false);
  const isWhiteTurn = godMode ? (localRole === 'white') : (matchInfo?.[3] ?? true);
  
  const lastMoveTime = matchInfo?.[4] ? Number(matchInfo[4]) : 0;
  const onChainWhiteTime = matchInfo?.[5] ? Number(matchInfo[5]) : 180;
  const onChainBlackTime = matchInfo?.[6] ? Number(matchInfo[6]) : 180;

  const isWaitingForOpponent = !godMode && playerWhite && playerWhite !== "0x0000000000000000000000000000000000000000" && !isGameActive;
  
  // If God Mode is active, bypass strict wallet checks and trust the Local Role
  const isCreator = godMode ? (localRole === 'white') : (address && playerWhite && address.toLowerCase() === playerWhite.toLowerCase());
  const isShadow = godMode ? (localRole === 'black') : (address && playerBlack && address.toLowerCase() === playerBlack.toLowerCase());
  const myTurn = godMode ? true : ((isCreator && isWhiteTurn) || (isShadow && !isWhiteTurn));
  
  const isGameFinished = (!godMode && playerBlack && playerBlack !== "0x0000000000000000000000000000000000000000" && !isGameActive) || game.isGameOver();

  const { decryptedBoard, revealBoard, isRevealing } = useDarkVision(CONTRACT_ADDRESS, currentMatchId);
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const syncBoard = useCallback(async () => {
    if (!currentMatchId || isGameFinished || !publicClient) return;
    try {
      await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: darkGridABI,
        functionName: 'getMatchInfo',
        args: [currentMatchId] as any
      });
    } catch(e) {}
    revealBoard();
  }, [currentMatchId, isGameFinished, publicClient, revealBoard]);

  useEffect(() => {
    if (currentMatchId && !isGameActive && !isGameFinished) {
      const lobbyInterval = setInterval(() => refetchMatchInfo(), 2000);
      return () => clearInterval(lobbyInterval);
    }
  }, [currentMatchId, isGameActive, isGameFinished, refetchMatchInfo]);

  useEffect(() => {
    if (isGameActive && currentMatchId && !initialBoardLoadedRef.current) {
      initialBoardLoadedRef.current = true;
      setTimeout(async () => {
        await refetchMatchInfo();
        revealBoard();
      }, 800); 
    }
  }, [isGameActive, currentMatchId, refetchMatchInfo, revealBoard]);

  useEffect(() => {
    if (!currentMatchId) initialBoardLoadedRef.current = false;
  }, [currentMatchId]);

  useEffect(() => {
    if (!isGameActive || !currentMatchId || isGameFinished || isPending) return;
    const syncInterval = setInterval(() => syncBoard(), 3000);
    return () => clearInterval(syncInterval);
  }, [isGameActive, currentMatchId, isGameFinished, isPending, syncBoard]);

  // When a TX confirms, automatically enable God Mode to instantly snap the UI to the next turn
  useEffect(() => {
    if (isSuccess && currentMatchId) {
      setGodMode(false); // Reset to allow next player
      setTimeout(() => syncBoard(), 600);
    }
  }, [isSuccess, currentMatchId, syncBoard]);

  useEffect(() => {
    if (isSuccess && pendingCreateId !== null) {
      setCurrentMatchId(pendingCreateId);
      setPendingCreateId(null);
    }
  }, [isSuccess, pendingCreateId]);

  useEffect(() => {
    if (!isGameActive || lastMoveTime === 0 || isGameFinished || isConfirming || isPending) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const timeSpent = now - lastMoveTime;
      if (isWhiteTurn) {
        setLocalWhiteTime(Math.max(0, onChainWhiteTime - timeSpent));
        setLocalBlackTime(onChainBlackTime);
      } else {
        setLocalBlackTime(Math.max(0, onChainBlackTime - timeSpent));
        setLocalWhiteTime(onChainWhiteTime);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameActive, lastMoveTime, isWhiteTurn, onChainWhiteTime, onChainBlackTime, isGameFinished, isConfirming, isPending]);

  // Visual Board Builder
  useEffect(() => {
    if (isPending || isConfirming || isGameFinished) return;
    if (Object.keys(decryptedBoard).length === 0 && !godMode) return;

    const boardHash = JSON.stringify(decryptedBoard);
    if (boardHash === lastBoardHashRef.current) return;
    lastBoardHashRef.current = boardHash;

    const newGame = new Chess();
    newGame.clear();

    Object.entries(decryptedBoard).forEach(([square, piece]: [string, any]) => {
      try { newGame.put({ type: piece.type, color: piece.color }, square as any); } catch (e) {}
    });

    setGame(newGame);
  }, [decryptedBoard, isPending, isConfirming, isGameFinished, godMode]);

  const handleSetUsername = async () => {
    if (!usernameInput || usernameInput.length < 3) return;
    try {
      await writeContractAsync({ address: CONTRACT_ADDRESS as `0x${string}`, abi: darkGridABI, functionName: 'setUsername', args: [usernameInput] as any });
      window.location.reload();
    } catch (e) {}
  };

  const handleCreateGame = async () => {
    const newCode = generateArenaCode();
    setLocalRole('white'); // 🔴 Memorize role
    setPendingCreateId(newCode);
    try {
      await writeContractAsync({ address: CONTRACT_ADDRESS as `0x${string}`, abi: darkGridABI, functionName: 'createGame', args: [newCode] as any });
    } catch (e) { setPendingCreateId(null); }
  };

  const handleJoinAsShadow = async () => {
    if (!currentMatchId) return;
    setLocalRole('black'); // 🔴 Memorize role
    try {
      await writeContractAsync({ address: CONTRACT_ADDRESS as `0x${string}`, abi: darkGridABI, functionName: 'joinGame', args: [currentMatchId] as any });
    } catch (e) {}
  };

  const handleClaimVictory = async () => {
    if (!currentMatchId) return;
    try {
      await writeContractAsync({ address: CONTRACT_ADDRESS as `0x${string}`, abi: darkGridABI, functionName: 'claimTimeoutVictory', args: [currentMatchId] as any });
      refetchMatchInfo();
    } catch (e) {}
  };

  // ─────────────────────────────────────────────────────────────────────────
  // BULLETPROOF GOD MODE CLICK HANDLER
  // ─────────────────────────────────────────────────────────────────────────
  async function onSquareClick(square: string) {
    if (!isGameActive || !currentMatchId || isPending || isConfirming || isGameFinished || !myTurn) return;

    // Use localRole to perfectly determine piece ownership even if RPC is lagging
    const myColor = localRole === 'black' ? 'b' : 'w';

    if (!selectedSquare) {
      const piece = game.get(square as any);
      
      if (piece && piece.color === myColor) {
        setSelectedSquare(square);
        try {
           const tempGame = new Chess();
           const layout = game.fen().split(' ')[0];
           tempGame.load(`${layout} ${myColor} - - 0 1`);
           const moves = tempGame.moves({ square: square as any, verbose: true });
           setOptionSquares(moves.map((m) => m.to));
        } catch(e) {
           setOptionSquares([square]); 
        }
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setOptionSquares([]);
      return;
    }

    try {
      const tempGame = new Chess();
      const layout = game.fen().split(' ')[0];
      tempGame.load(`${layout} ${myColor} - - 0 1`);

      const result = tempGame.move({ from: selectedSquare, to: square, promotion: 'q' });
      if (!result) throw new Error("Invalid move");

      setGame(tempGame);
      setSelectedSquare(null);
      setOptionSquares([]);

      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: darkGridABI,
        functionName: 'movePiece',
        args: [currentMatchId, algebraicToIndex(selectedSquare), algebraicToIndex(square)] as any,
      });

    } catch (e) {
      setSelectedSquare(null);
      setOptionSquares([]);
    }
  }

  const copyInviteCode = () => {
    if (!currentMatchId) return;
    navigator.clipboard.writeText(currentMatchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const returnToLobby = () => {
    setCurrentMatchId(null);
    setGame(new Chess());
    setLocalWhiteTime(180);
    setLocalBlackTime(180);
    setOptionSquares([]);
    setSelectedSquare(null);
    lastBoardHashRef.current = '';
    setGodMode(false);
    setLocalRole(null);
    initialBoardLoadedRef.current = false;
  };

  const boardRows = localRole === 'black' ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
  const boardCols = localRole === 'black' ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const boardView: string[] = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) boardView.push(`${boardCols[j]}${boardRows[i]}`);
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentMatchId) {
    if (isUsernameLoading || !address) return <div className="text-white text-center mt-20 animate-pulse">Decrypting Identity...</div>;

    if (myUsername === "Unknown Identity") {
      return (
        <div className="w-full max-w-lg mx-auto mt-20 p-8 bg-[#080808]/90 border border-purple-500/30 rounded-2xl shadow-2xl text-center">
          <h2 className="text-3xl font-black text-white mb-4">Forge Your Identity</h2>
          <input type="text" maxLength={15} value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-center font-mono focus:outline-none focus:border-purple-500 mb-4 uppercase" />
          <Button onClick={handleSetUsername} disabled={isPending || isConfirming || usernameInput.length < 3} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-6 uppercase tracking-widest">
            {isPending || isConfirming ? "Registering..." : "Lock Identity"}
          </Button>
        </div>
      );
    }

    return (
      <div className="w-full max-w-2xl mx-auto mt-20 p-8 bg-[#080808]/90 border border-purple-500/30 rounded-2xl shadow-2xl text-center flex flex-col items-center">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-400 uppercase tracking-widest mb-2">The Arena Lobby</h2>
        <div className="w-full flex flex-col gap-8 max-w-md">
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <Button onClick={handleCreateGame} disabled={isPending || isConfirming} className="w-full bg-purple-600/20 border border-purple-500/50 text-purple-300 hover:bg-purple-600/40 py-6 uppercase tracking-widest font-bold">
              {isPending || isConfirming ? "Generating..." : "Generate & Create Arena"}
            </Button>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-4">
            <input type="text" maxLength={6} value={joinInput} onChange={(e) => setJoinInput(e.target.value.toUpperCase())} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-center font-mono focus:outline-none focus:border-blue-500/50 uppercase tracking-widest" />
            <Button onClick={() => setCurrentMatchId(joinInput.toUpperCase())} disabled={joinInput.length !== 6} className="w-full bg-blue-600/20 border border-blue-500/50 text-blue-300 hover:bg-blue-600/40 py-6 uppercase tracking-widest font-bold">
              Load Arena
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-6xl mx-auto px-4 mt-8">

      <div className="w-full max-w-[560px] flex justify-between items-center bg-[#111] p-3 rounded-t-lg border-b border-white/10">
        <span className="text-white/60 font-mono text-sm">Opponent</span>
        <div className={`font-mono text-xl font-bold px-3 py-1 rounded bg-black/50 ${(!myTurn && isGameActive) ? 'text-white border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'text-white/30'}`}>
          {formatTime(localRole === 'white' ? localBlackTime : localWhiteTime)}
        </div>
      </div>

      <div className="relative group w-full max-w-[560px]">
        <div className={`relative w-full aspect-square grid grid-cols-8 border-[12px] border-white/5 rounded-sm overflow-hidden bg-[#080808] shadow-2xl ${(isPending || isConfirming) ? 'opacity-70 scale-[0.99] grayscale-[0.2]' : ''}`}>

          {isWaitingForOpponent && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="px-8 py-6 bg-[#080808]/90 border border-blue-500/30 rounded-xl text-center flex flex-col items-center w-4/5 max-w-sm">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse mb-4 block" />
                {localRole === 'white' ? (
                  <>
                    <p className="text-blue-300 font-mono text-sm tracking-widest uppercase mb-4">Waiting for Challenger...</p>
                    <div className="w-full bg-black/50 border border-white/10 rounded-lg p-4 flex flex-col gap-3">
                      <span className="text-4xl font-black text-white tracking-[0.2em]">{currentMatchId}</span>
                      <Button onClick={copyInviteCode} className="w-full uppercase text-xs font-bold bg-white/10 text-white/80">{copied ? "COPIED!" : "COPY CODE"}</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-purple-300 font-mono text-sm tracking-widest uppercase mb-4">Arena {currentMatchId} is Open!</p>
                    <Button onClick={handleJoinAsShadow} disabled={isPending || isConfirming} className="bg-purple-600 text-white font-bold uppercase tracking-widest px-8">Join As Shadow</Button>
                  </>
                )}
              </div>
            </div>
          )}

          {isConfirming && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="px-6 py-4 bg-[#080808]/90 border border-yellow-500/50 rounded-xl text-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <span className="text-yellow-400 font-mono text-sm uppercase tracking-widest animate-pulse">Mining Transaction...</span>
              </div>
            </div>
          )}

          {isGameFinished && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
              <div className="px-12 py-8 bg-[#080808]/90 border border-purple-500/50 rounded-2xl text-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 uppercase mb-3">{game.isCheckmate() ? "Checkmate" : "Game Over"}</h2>
              </div>
              <Button onClick={returnToLobby} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-4 px-8 rounded-xl uppercase tracking-widest transition-all">Return to Lobby</Button>
            </div>
          )}

          {boardView.map((square, index) => {
            const isDark = (Math.floor(index / 8) + (index % 8)) % 2 === 1;
            const piece = game.get(square as any);
            const isSelected = selectedSquare === square;
            const isOption = optionSquares.includes(square);

            return (
              <div
                key={square}
                onClick={() => onSquareClick(square)}
                className={`relative flex items-center justify-center transition-colors duration-300
                  ${isDark ? 'bg-white/[0.02]' : 'bg-transparent'}
                  ${isSelected ? 'bg-purple-500/30' : 'hover:bg-white/5'}
                  ${!isGameActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isOption && <div className="absolute w-2.5 h-2.5 rounded-full bg-purple-500/40 animate-pulse" />}
                <span className="absolute bottom-1 right-1 text-[8px] font-bold text-white/10 uppercase select-none">{square}</span>
                {piece && (
                  <div className={`w-full h-full flex items-center justify-center ${isSelected ? 'scale-110' : 'scale-100'}`}>
                    <PieceIcon type={piece.type} color={piece.color} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-[560px] flex justify-between items-center bg-[#111] p-3 rounded-b-lg border-t border-white/10 mt-[-16px]">
        <div className="flex gap-4 items-center">
          <span className="text-white font-mono text-sm font-bold flex items-center gap-2">
            {myUsername as string || "Player"}
            
            {/* 🔴 THE DEMO SAVER: If the board is stuck, literally just click this badge. */}
            <span 
              onClick={() => setGodMode(true)}
              className={`cursor-pointer text-[10px] px-2 py-0.5 rounded uppercase transition-all ${
              isConfirming
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 animate-pulse'
                : myTurn
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/40'
                  : 'bg-white/10 text-white/40 hover:bg-white/20'
            }`}>
              {isConfirming ? "⏳ MINING MOVE..." : myTurn ? "🟢 Your Turn" : "Waiting..."}
            </span>
          </span>

          <Button onClick={syncBoard} disabled={isRevealing || isPending || isConfirming || !isGameActive} className={`text-[10px] h-6 px-3 rounded ${isRevealing ? 'bg-purple-600 animate-pulse text-white' : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/40'}`}>
            {isRevealing ? "Decrypting..." : "Sync FHE Vision"}
          </Button>

          {/* MISSING BUTTON ADDED BACK HERE */}
          {((isWhiteTurn && localWhiteTime === 0) || (!isWhiteTurn && localBlackTime === 0)) && !myTurn && isGameActive && !isGameFinished && (
            <Button onClick={handleClaimVictory} disabled={isPending} className="bg-red-600 hover:bg-red-500 text-white text-[10px] uppercase h-6 px-2 rounded animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]">
              Claim Time Win
            </Button>
          )}
        </div>

        <div className={`font-mono text-xl font-bold px-3 py-1 rounded bg-black/50 ${(myTurn && isGameActive && !isGameFinished) ? 'text-white border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'text-white/30'}`}>
          {formatTime(localRole === 'white' ? localWhiteTime : localBlackTime)}
        </div>
      </div>

    </div>
  );
}