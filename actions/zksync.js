import { ethers } from 'ethers';
import * as zksync from 'zksync';

export const withdrawZKSync = async (context, event) => {
  const syncProvider = await zksync.getDefaultProvider('goerli');
  const ethersProvider = ethers.getDefaultProvider('goerli');

  let privateKey = await context.secrets.get('WALLET-KEY');
  const ethWallet = new ethers.Wallet(privateKey, ethersProvider);
  const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

  const balance = syncWallet.getBalance('ETH')

  const withdraw = await syncWallet.withdrawFromSyncToEthereum({
    ethAddress: ethWallet.address,
    token: 'ETH',
    amount: balance.sub(ethers.utils.parseEther('0.1'))
  });

  await withdraw.awaitVerifyReceipt();
}
