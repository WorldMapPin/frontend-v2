/**
 * Custom hook for Hive blockchain actions (voting and commenting)
 * Uses Aioha library for transaction signing across different providers
 */

'use client';

import { useState, useCallback } from 'react';
import { useAiohaSafe } from './use-aioha-safe';

// Vote result interface
interface VoteResult {
  success: boolean;
  error?: string;
  txId?: string;
}

// Comment result interface
interface CommentResult {
  success: boolean;
  error?: string;
  txId?: string;
  permlink?: string;
}

// Hook return type
interface UseHiveActionsReturn {
  // State
  isVoting: boolean;
  isCommenting: boolean;
  user: string | null;
  isLoggedIn: boolean;
  
  // Actions
  vote: (author: string, permlink: string, weight: number) => Promise<VoteResult>;
  comment: (parentAuthor: string, parentPermlink: string, body: string) => Promise<CommentResult>;
  
  // Utilities
  generateCommentPermlink: (parentPermlink: string) => string;
}

/**
 * Generate a unique permlink for a new comment
 * Format: re-{parentPermlink}-{timestamp}
 */
function generateCommentPermlink(parentPermlink: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  // Sanitize and truncate parent permlink
  const sanitizedParent = parentPermlink
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 20);
  return `re-${sanitizedParent}-${timestamp}${random}`;
}

/**
 * Custom hook for Hive voting and commenting actions
 */
export function useHiveActions(): UseHiveActionsReturn {
  const { aioha, user, isReady } = useAiohaSafe();
  const [isVoting, setIsVoting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const isLoggedIn = isReady && !!user && !!aioha;

  /**
   * Vote on a Hive post or comment
   * @param author - The author of the post/comment
   * @param permlink - The permlink of the post/comment
   * @param weight - Vote weight in basis points (-10000 to 10000, where 10000 = 100%)
   */
  const vote = useCallback(async (
    author: string,
    permlink: string,
    weight: number
  ): Promise<VoteResult> => {
    if (!aioha || !user) {
      return { success: false, error: 'Not logged in' };
    }

    // Validate weight range
    const clampedWeight = Math.max(-10000, Math.min(10000, Math.round(weight)));

    setIsVoting(true);
    try {
      // Use Aioha's vote method
      const result = await aioha.vote(author, permlink, clampedWeight);
      
      if (result.success) {
        return { 
          success: true, 
          txId: result.result as string 
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Vote failed' 
        };
      }
    } catch (error: any) {
      console.error('Vote error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to vote' 
      };
    } finally {
      setIsVoting(false);
    }
  }, [aioha, user]);

  /**
   * Post a comment on a Hive post or reply to a comment
   * @param parentAuthor - The author of the parent post/comment
   * @param parentPermlink - The permlink of the parent post/comment
   * @param body - The comment body (Markdown supported)
   */
  const comment = useCallback(async (
    parentAuthor: string,
    parentPermlink: string,
    body: string
  ): Promise<CommentResult> => {
    if (!aioha || !user) {
      return { success: false, error: 'Not logged in' };
    }

    if (!body.trim()) {
      return { success: false, error: 'Comment cannot be empty' };
    }

    const permlink = generateCommentPermlink(parentPermlink);
    
    // Build JSON metadata
    const jsonMetadata = {
      app: 'worldmappin/1.0',
      format: 'markdown',
    };

    setIsCommenting(true);
    try {
      // Use Aioha's comment method
      // Signature: comment(parentAuthor, parentPermlink, permlink, title, body, jsonMetadata)
      const result = await aioha.comment(
        parentAuthor,
        parentPermlink,
        permlink,
        '', // title (empty for comments)
        body,
        jsonMetadata
      );
      
      if (result.success) {
        return { 
          success: true, 
          txId: result.result as string,
          permlink 
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Comment failed' 
        };
      }
    } catch (error: any) {
      console.error('Comment error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to post comment' 
      };
    } finally {
      setIsCommenting(false);
    }
  }, [aioha, user]);

  return {
    isVoting,
    isCommenting,
    user,
    isLoggedIn,
    vote,
    comment,
    generateCommentPermlink,
  };
}

export default useHiveActions;




