/**
 * Safe wrapper for useAioha hook
 * Handles cases where AiohaProvider might not be ready yet
 */

'use client';

import { useAioha } from '@aioha/react-ui';

export const useAiohaSafe = () => {
  try {
    const result = useAioha();
    return result || { user: null, aioha: null };
  } catch (error) {
    // Provider not ready yet, return default values
    return { user: null, aioha: null };
  }
};

