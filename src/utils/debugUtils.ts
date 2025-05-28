// 调试工具
export const debugLog = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [${category}] ${message}`, data || '');
};

export const validateGameState = (gameState: any): boolean => {
  if (!gameState) {
    debugLog('VALIDATION', '游戏状态为null或undefined');
    return false;
  }
  
  if (!gameState.board || !Array.isArray(gameState.board)) {
    debugLog('VALIDATION', '棋盘数据无效', gameState.board);
    return false;
  }
  
  if (gameState.board.length !== 6) {
    debugLog('VALIDATION', '棋盘尺寸错误', gameState.board.length);
    return false;
  }
  
  for (let i = 0; i < gameState.board.length; i++) {
    if (!Array.isArray(gameState.board[i]) || gameState.board[i].length !== 6) {
      debugLog('VALIDATION', `第${i}行数据错误`, gameState.board[i]);
      return false;
    }
  }
  
  debugLog('VALIDATION', '游戏状态验证通过');
  return true;
};

export const logGameStateChange = (oldState: any, newState: any, action: string) => {
  debugLog('STATE_CHANGE', `执行操作: ${action}`);
  
  if (oldState && newState) {
    debugLog('STATE_CHANGE', '状态变化:', {
      当前玩家: `${oldState.currentPlayer} -> ${newState.currentPlayer}`,
      大炮数量: `${oldState.cannonPieces?.length || 0} -> ${newState.cannonPieces?.length || 0}`,
      小兵数量: `${oldState.soldierPieces?.length || 0} -> ${newState.soldierPieces?.length || 0}`,
      游戏结束: `${oldState.gameOver} -> ${newState.gameOver}`
    });
  }
}; 