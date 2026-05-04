// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract DarkGrid is ZamaEthereumConfig {

    struct Match {
        address playerWhite;
        address playerBlack;
        bool gameActive;
        bool isWhiteTurn;
        euint8[64] board;
        uint256 lastMoveTimestamp;
        uint256 whiteTimeRemaining;
        uint256 blackTimeRemaining;
    }

    mapping(string => Match) private matches;
    mapping(address => string) public usernames;

    event GameCreated(string matchId, address creator);
    event GameJoined(string matchId, address white, address shadow);
    event MoveCommitted(string matchId, address indexed player, uint8 from, uint8 to);
    event UsernameSet(address indexed player, string username);

    constructor() {}

    function setUsername(string calldata _username) external {
        usernames[msg.sender] = _username;
        emit UsernameSet(msg.sender, _username);
    }

    function getUsername(address player) external view returns (string memory) {
        if (bytes(usernames[player]).length == 0) return "Unknown Identity";
        return usernames[player];
    }

    function createGame(string calldata matchId) external {
        Match storage m = matches[matchId];
        require(m.playerWhite == address(0), "Arena code exists");

        m.playerWhite = msg.sender;
        m.gameActive = false;
        m.isWhiteTurn = true;
        m.whiteTimeRemaining = 180;
        m.blackTimeRemaining = 180;

        for (uint8 i = 0; i < 64; i++) {
            m.board[i] = FHE.asEuint8(0);
            FHE.allowThis(m.board[i]);
        }
        emit GameCreated(matchId, msg.sender);
    }

    function joinGame(string calldata matchId) external {
        Match storage m = matches[matchId];
        require(!m.gameActive, "Arena active");
        require(m.playerWhite != address(0), "Arena missing");

        m.playerBlack = msg.sender;
        m.gameActive = true;
        m.lastMoveTimestamp = block.timestamp;

        _setupInitialBoard(matchId);
        emit GameJoined(matchId, m.playerWhite, m.playerBlack);
    }

    function movePiece(string calldata matchId, uint8 from, uint8 to) external {
        Match storage m = matches[matchId];

        require(m.gameActive, "Game not active");
        require(msg.sender == (m.isWhiteTurn ? m.playerWhite : m.playerBlack), "Not your turn");

        m.board[to] = m.board[from];
        m.board[from] = FHE.asEuint8(0);

        // Re-grant access after reassignment
        FHE.allowThis(m.board[to]);
        FHE.allowThis(m.board[from]);
        FHE.allow(m.board[to], m.playerWhite);
        FHE.allow(m.board[to], m.playerBlack);
        FHE.allow(m.board[from], m.playerWhite);
        FHE.allow(m.board[from], m.playerBlack);

        m.isWhiteTurn = !m.isWhiteTurn;
        m.lastMoveTimestamp = block.timestamp;

        emit MoveCommitted(matchId, msg.sender, from, to);
    }

    function claimTimeoutVictory(string calldata matchId) external {
        Match storage m = matches[matchId];
        m.gameActive = false;
    }

    function _setupInitialBoard(string calldata matchId) internal {
        Match storage m = matches[matchId];

        // White pieces: 1=pawn 2=rook 3=knight 4=bishop 5=queen 6=king
        uint8[8] memory whiteBackRank = [2, 3, 4, 5, 6, 4, 3, 2];
        for (uint8 i = 0; i < 8; i++) {
            m.board[i] = FHE.asEuint8(whiteBackRank[i]);
            m.board[i + 8] = FHE.asEuint8(1);
            _grantBoardAccess(m, i);
            _grantBoardAccess(m, i + 8);
        }

        // Black pawns
        for (uint8 i = 48; i < 56; i++) {
            m.board[i] = FHE.asEuint8(7);
            _grantBoardAccess(m, i);
        }

        // Black pieces: 7=pawn 8=rook 9=knight 10=bishop 11=queen 12=king
        uint8[8] memory shadowBackRank = [8, 9, 10, 11, 12, 10, 9, 8];
        for (uint8 i = 0; i < 8; i++) {
            m.board[i + 56] = FHE.asEuint8(shadowBackRank[i]);
            _grantBoardAccess(m, i + 56);
        }

        // Empty squares in the middle — grant access too
        for (uint8 i = 16; i < 48; i++) {
            m.board[i] = FHE.asEuint8(0);
            _grantBoardAccess(m, i);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // _grantBoardAccess: grants ACL permissions on a board square to both players
    //
    // In the new @fhevm/solidity, encrypted values are ciphertext HANDLES.
    // You must explicitly call FHE.allow(handle, address) for every address
    // that is allowed to decrypt that handle via the gateway.
    // Without this, readContract on viewBoard returns handles the frontend
    // cannot decrypt — the gateway will reject the request.
    // ─────────────────────────────────────────────────────────────────────────
    function _grantBoardAccess(Match storage m, uint8 index) internal {
        FHE.allowThis(m.board[index]);
        FHE.allow(m.board[index], m.playerWhite);
        FHE.allow(m.board[index], m.playerBlack);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // viewBoard: returns raw ciphertext HANDLES (bytes32 each)
    //
    // The new fhEVM does NOT use FHE.reencrypt() in Solidity at all.
    // viewBoard just returns the euint8 handles. The frontend then calls
    // the Zama Gateway with these handles + a signature to get the decrypted
    // values. FHE.toBytes32() unwraps the euint8 into its handle value.
    // ─────────────────────────────────────────────────────────────────────────
    function viewBoard(string calldata matchId) public view returns (bytes32[] memory) {
        Match storage m = matches[matchId];
        bytes32[] memory handles = new bytes32[](64);
        for (uint8 i = 0; i < 64; i++) {
            handles[i] = FHE.toBytes32(m.board[i]);
        }
        return handles;
    }

    function getMatchInfo(string calldata matchId)
        public
        view
        returns (address, address, bool, bool, uint256, uint256, uint256)
    {
        Match storage m = matches[matchId];
        return (
            m.playerWhite,
            m.playerBlack,
            m.gameActive,
            m.isWhiteTurn,
            m.lastMoveTimestamp,
            m.whiteTimeRemaining,
            m.blackTimeRemaining
        );
    }
}
