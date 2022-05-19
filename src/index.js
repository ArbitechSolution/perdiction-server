const cron = require("node-cron");
const Web3 = require("web3")
const ethUtil = require("ethereumjs-util");
const ethereum_address = require("ethereum-address");
const Betting = require("./database/schema");
const {
  contractAbi,
  contractAddress
} = require("../utils/utils")
const web3 = new Web3('https://bsc-dataseed.binance.org');
const contract = new web3.eth.Contract(contractAbi, contractAddress);
const userAddress = "0x15a1d9502c7E4D8364664cD6CC7016Ef3f9604e1";

exports.startBatting = async (req, res) => {
  try {
    let {
      bol,
      method,
      amount,
      id
    } = req.query;

    let betting = new Betting();
    let bettingdata = await Betting.find();
    if (bettingdata.length) {
      console.log("id", id);
      let filter = {
        id: id,
      };
      const options = {
        upsert: true
      };
      let updateOneRecord = {
        $set: {
          action: bol,
          method: method,
          amount: amount,
          id: id,
        },
      };
      let result = await Betting.findOneAndUpdate({
        id: id
      }, updateOneRecord);
      res.send(200, {
        msg: "data updated"
      });
    } else {
      betting.action = bol;
      betting.method = method;
      betting.amount = amount;
      betting.id = id;
      await betting.save();
      res.send(200, {
        msg: "data save"
      });
    }

    console.log("bol", typeof bol);

  } catch (e) {
    console.error("error while", e);
    res.status(500).send({
      msg: e
    });
  }
};

exports.checkBatting = async () => {
  try {
    cron.schedule("* * * * *", async () => {
      try {
        let data = await Betting.find()
        console.log("amount", data[0].amount);
        if (data[0].action == "true") {
          let bal = await web3.eth.getBalance(userAddress);
          bal = web3.utils.fromWei(bal)
          if(bal > 0){
          let epoch = await contract.methods.currentEpoch().call();
          console.log("epoch", epoch);
          let ledger = await contract.methods.ledger(epoch, userAddress).call();
          if (ledger.amount <= 0) {
            console.log("ledger.amount ", ledger.amount);
            let round = await contract.methods.rounds(epoch).call();
            let currentTime = Date.now() / 1000;
            console.log("current time0", currentTime);
            let startTime = round.startTimestamp;
            startTime = parseInt(startTime)
            let lockTime = round.lockTimestamp;
            lockTime = parseInt(lockTime)
            console.log("start time", startTime);
            console.log("check", startTime <= currentTime, currentTime <= lockTime);

            console.log("lock time", lockTime);
            if (startTime <= currentTime && currentTime <= lockTime) {
              if (data[0].amount >= 0.001) {
                if (data[0].method == "betbear") {
                  callMethods("betbear", (data[0].amount).toString(), epoch)
                } else if (data[0].method == "betbull") {
                  callMethods("betbull", (data[0].amount).toString(), epoch)
                }
              } else {
                console.log("plese enter amount should be greater than 0.001");
              }
            } else {
              console.log("time reached");
            }
          } else {
            console.log("Already bet startd");

          }
        }else {
          console.log("please recharge the account")
        }
        } else {
          console.log("if you start the bet please change action");
        }
        console.log("running a task every one minutes");
      } catch (e) {
        console.error("error while cron job", e);
      }
    });
  } catch (e) {
    console.error("error while check betting");
  }
};


const callMethods = async (method, amount, epoch) => {
  console.log("call methods", typeof amount);
  let privateKey = "2edfbfc01d70fe3af76e1409a652839c1a6b964af3ba0626fbe5e3dc27083dca";
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }
  let bufferedKey = ethUtil.toBuffer(privateKey);
  console.log("xxx");
  if (
    ethereum_address.isAddress(userAddress) &&
    ethereum_address.isAddress(userAddress) &&
    ethUtil.isValidPrivate(bufferedKey)
  ) {
    let count = await web3.eth.getTransactionCount(userAddress, "pending");;
    console.log("usr acc", );
    web3.eth.defaultAccount = userAddress;
    let tx_builder;
    web3.eth.accounts.wallet.add(privateKey);
    if (method == "betbull") {
      tx_builder = await contract.methods.betBull(epoch);

    } else if (method == "betbear") {
      tx_builder = await contract.methods.betBear(epoch);
    }

    console.log("11211212");
    let encoded_tx = tx_builder.encodeABI();

    let gasPrice = await web3.eth.getGasPrice();
    let transactionObject = {
      nonce: web3.utils.toHex(count),
      from: userAddress,
      gasPrice: web3.utils.toHex(gasPrice),
      gasLimit: web3.utils.toHex(232276),
      to: contractAddress,
      data: encoded_tx,
      value: web3.utils.toWei(amount),
      chainId: 56
    };
    web3.eth.accounts
      .signTransaction(transactionObject, privateKey)
      .then((signedTx) => {
        web3.eth.sendSignedTransaction(
          signedTx.rawTransaction,
          async function (err, hash) {
            if (!err) {
              console.log("hash is : ", hash);

            } else {
              console.log(`Bad Request ${err}`);
            }
          }
        );
      })
      .catch((err) => {
        return response.status(400).json({
          msg: `Your private or public address is not correct`,
        });
      });
  } else {
    return response.status(400).json({
      msg: `Your private or public address is not correct`,
    });
  }
}