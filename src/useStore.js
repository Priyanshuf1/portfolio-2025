import { create } from 'zustand'

export const useStore = create((set) => ({
  currentScene: 'cat', // 'cat' or 'car'
  gamePhase: 'idle', // 'idle', 'ready', 'lights-out', 'finished'
  reactionTime: null,
  
  setScene: (scene) => set({ currentScene: scene }),
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setReactionTime: (time) => set({ reactionTime: time }),
  
  resetGame: () => set({ gamePhase: 'idle', reactionTime: null })
}))
