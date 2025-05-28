import React from 'react';
import '../styles/GameRules.css';

const GameRules: React.FC = () => {
  return (
    <div className="game-rules">
      <h3>⚡ 游戏规则</h3>
      <ul>
        <li>🎯 大炮玩家操作2枚"大炮"棋子</li>
        <li>⚔️ 小兵玩家操作18枚"小兵"棋子</li>
        <li>🎮 大炮玩家先手，轮流移动</li>
        <li>💥 大炮可以吃相隔一格的小兵</li>
        <li>🏆 小兵少于6个时，大炮玩家胜</li>
        <li>🛡️ 大炮无法移动时，小兵玩家胜</li>
        <li>🌐 支持联机对战，创建或加入房间</li>
      </ul>
    </div>
  );
};

export default GameRules; 