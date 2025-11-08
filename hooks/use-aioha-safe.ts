/**
 * Safe wrapper for useAioha hook
 * Handles cases where AiohaProvider might not be ready yet
 */

'use client';

import { useContext } from 'react';
import { SafeAiohaContext } from '@/components/AiohaProvider';

export const useAiohaSafe = () => {
  const context = useContext(SafeAiohaContext);
  return context;
};

