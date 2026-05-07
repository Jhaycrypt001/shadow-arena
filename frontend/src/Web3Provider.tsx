import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// RainbowKit handles all the complex wallet connections automatically
const config = getDefaultConfig({
  appName: 'Shadow Arena',
  projectId: 'YOUR_PROJECT_ID', // (In production, you get a free ID from cloud.walletconnect.com)
  chains: [sepolia],
  ssr: false, 
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* We use darkTheme to match your Shadow Arena vibe */}
        <RainbowKitProvider theme={darkTheme({ accentColor: '#9333ea' })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}