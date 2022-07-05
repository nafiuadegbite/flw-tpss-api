function reducer(previous, current, index, array) {
  const returns = previous.SplitValue + current.SplitValue;
  return returns;
}

const httpPostTpss = (req, res) => {
  const { ID, Amount, Currency, Email, SplitInfo } = req.body;

  let response;
  let balance = Amount;
  let splitInfo = SplitInfo;
  let splitBreakdown = [];

  if (splitInfo.length > 0 && splitInfo.length <= 20) {
    let flatDetails = splitInfo.filter((info) => info.SplitType === "FLAT");
    let percentageDetails = splitInfo.filter(
      (info) => info.SplitType === "PERCENTAGE"
    );
    let ratioDetails = splitInfo.filter((info) => info.SplitType === "RATIO");

    flatDetails.forEach((flatDetail) => {
      let splitValue = flatDetail.SplitValue;
      let splitEntityId = flatDetail.SplitEntityId;

      if (splitValue < balance && splitValue >= 0) {
        balance -= splitValue;
        splitBreakdown.push({
          SplitEntityId: splitEntityId,
          Amount: splitValue,
        });
      } else {
        res.status(400).json({
          message: `The split value ${splitValue} is more than the balance ${balance}`,
        });
        res.end();
      }
    });

    percentageDetails.forEach((percentageDetail) => {
      let splitValue = percentageDetail.SplitValue;
      let splitEntityId = percentageDetail.SplitEntityId;

      if (splitValue >= 0) {
        let percentValue = (splitValue / 100) * balance;

        if (percentValue < balance) {
          balance -= percentValue;
          splitBreakdown.push({
            SplitEntityId: splitEntityId,
            Amount: percentValue,
          });
        } else {
          res.status(400).json({
            message: `The percent value ${percentValue} is more than the balance ${balance}`,
          });
          res.end();
        }
      }
    });

    let ratioValue = 0;

    ratioDetails.forEach((ratioDetail) => {
      const totalRatio = ratioDetails.reduce(reducer);

      let splitValue = ratioDetail.SplitValue;
      let splitEntityId = ratioDetail.SplitEntityId;

      if (splitValue >= 0) {
        let value = (splitValue / totalRatio) * balance;
        ratioValue += value;

        splitBreakdown.push({
          SplitEntityId: splitEntityId,
          Amount: value,
        });
      }
    });

    balance -= ratioValue;
  } else {
    res.status(400).json({ message: `request is not within limit` });
    res.end();
  }

  if (!(balance < 0)) {
    response = {
      ID: ID,
      Balance: balance,
      SplitBreakdown: splitBreakdown,
    };
  } else {
    res.status(400).json({ message: `The balance is less than 0` });
    res.end();
  }

  res.status(200).json(response);
};

module.exports = { httpPostTpss };
