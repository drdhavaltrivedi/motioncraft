/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}

export {};

