/**
 * Typing Timeout Manager
 * 
 * Manages typing indicator timeouts with proper cleanup.
 * This prevents memory leaks from orphaned setTimeout calls.
 * 
 * Usage:
 * - Call `setTypingTimeout()` when a user starts typing
 * - Call `clearTypingTimeout()` when they stop typing
 * - Call `clearAll()` on chat store reset/logout
 */

type TimeoutCallback = () => void
type TimerId = ReturnType<typeof setTimeout>

class TypingTimeoutManager {
  /** Map of chatRoomId:userId -> timeout ID */
  private timeouts: Map<string, TimerId> = new Map()
  
  /** Default timeout duration in ms */
  private defaultTimeout = 3000

  /**
   * Generate a unique key for a typing timeout
   */
  private getKey(chatRoomId: number, userId: number): string {
    return `${chatRoomId}:${userId}`
  }

  /**
   * Set a typing timeout for a user in a chat room
   * Automatically clears any existing timeout for the same user
   */
  setTypingTimeout(
    chatRoomId: number,
    userId: number,
    callback: TimeoutCallback,
    duration: number = this.defaultTimeout
  ): void {
    const key = this.getKey(chatRoomId, userId)
    
    // Clear existing timeout for this user
    this.clearTypingTimeout(chatRoomId, userId)
    
    // Set new timeout
    const timeoutId = setTimeout(() => {
      // Remove from map before executing callback
      this.timeouts.delete(key)
      callback()
    }, duration)
    
    this.timeouts.set(key, timeoutId)
  }

  /**
   * Clear typing timeout for a specific user in a chat room
   */
  clearTypingTimeout(chatRoomId: number, userId: number): void {
    const key = this.getKey(chatRoomId, userId)
    const timeoutId = this.timeouts.get(key)
    
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.timeouts.delete(key)
    }
  }

  /**
   * Clear all typing timeouts for a specific chat room
   */
  clearRoomTimeouts(chatRoomId: number): void {
    const prefix = `${chatRoomId}:`
    
    for (const [key, timeoutId] of this.timeouts.entries()) {
      if (key.startsWith(prefix)) {
        clearTimeout(timeoutId)
        this.timeouts.delete(key)
      }
    }
  }

  /**
   * Clear ALL typing timeouts (call on logout/reset)
   */
  clearAll(): void {
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId)
    }
    this.timeouts.clear()
    console.log('[TypingTimeoutManager] Cleared all typing timeouts')
  }

  /**
   * Get count of active timeouts (for debugging)
   */
  getActiveCount(): number {
    return this.timeouts.size
  }

  /**
   * Check if a user has an active typing timeout
   */
  hasTimeout(chatRoomId: number, userId: number): boolean {
    return this.timeouts.has(this.getKey(chatRoomId, userId))
  }
}

// Singleton instance
export const typingTimeoutManager = new TypingTimeoutManager()
