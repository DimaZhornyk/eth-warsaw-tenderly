import { ethers } from 'ethers';
import * as optimismSDK from '@eth-optimism/sdk';

const goerliId = 5;
const ethInGwei = 0.00000000165;
const l1Url = 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
const l2Url = 'https://goerli.optimism.io';

export const withdrawOptimism = async (context, event) => {
  let privateKey = await context.secrets.get('WALLET-KEY');
  const [l1Signer, l2Signer] = await getSigners(privateKey);

  crossChainMessenger = new optimismSDK.CrossChainMessenger({
    l1ChainId: goerliId,
    l1SignerOrProvider: l1Signer,
    l2SignerOrProvider: l2Signer
  });

  const l2Balance = (await crossChainMessenger.l2Signer.getBalance()).toString().slice(0, -9);
  const response = await crossChainMessenger.withdrawETH(parseFloat(l2Balance) * ethInGwei - 0.1);
  await response.wait();

  await crossChainMessenger.waitForMessageStatus(response.hash, optimismSDK.MessageStatus.IN_CHALLENGE_PERIOD);
  await crossChainMessenger.waitForMessageStatus(response.hash, optimismSDK.MessageStatus.READY_FOR_RELAY);

  await crossChainMessenger.finalizeMessage(response);
  await crossChainMessenger.waitForMessageStatus(response, optimismSDK.MessageStatus.RELAYED);
}

const getSigners = async (privateKey) => {
  const l1RpcProvider = new ethers.providers.JsonRpcProvider(l1Url);
  const l2RpcProvider = new ethers.providers.JsonRpcProvider(l2Url);

  const l1Wallet = new ethers.Wallet(privateKey, l1RpcProvider);
  const l2Wallet = new ethers.Wallet(privateKey, l2RpcProvider);

  return [l1Wallet, l2Wallet];
}