

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
  
  // Configure Aioha with app-specific settings
  aioha.setup({
    hiveauth: {
      name: 'WorldMapPin',
      description: 'Share your travel adventures on the blockchain'
    }
    // HiveSigner can be added here if needed in the future
    // hivesigner: {
    //   app: 'worldmappin.app',
    //   callbackURL: window.location.origin + '/hivesigner.html',
    //   scope: ['login', 'vote', 'comment']
    // }
  })
  
  return aioha
}

export { Providers }
export type { Aioha }

