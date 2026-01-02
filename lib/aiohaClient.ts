'use client';

import { Aioha, Providers } from '@aioha/aioha'

let aiohaInstance: Aioha | null = null

export const getAioha = (): Aioha => {
  if (!aiohaInstance) {
    aiohaInstance = new Aioha()
  }
  return aiohaInstance
}

export const initializeAioha = () => {
  const aioha = getAioha()
  
  // Get the callback URL (only available in browser)
  const callbackURL = typeof window !== 'undefined' 
    ? `${window.location.origin}/hivesigner`
    : 'https://v2.worldmappin.com/hivesigner';
  
  // Configure Aioha with app-specific settings
  aioha.setup({
    hiveauth: {
      name: 'WorldMapPin',
      description: 'Share your travel adventures on the blockchain'
    },
    hivesigner: {
      app: 'v2.worldmappin.com',
      callbackURL: callbackURL,
      scope: ['login', 'vote', 'comment']
    }
  })
  
  return aioha
}

export { Providers }
export type { Aioha }

