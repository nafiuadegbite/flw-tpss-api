const reducer = (previous, current) => {
  const returns = previous.SplitValue + current.SplitValue;
  return returns;
};

const sortArray = (arr, splitType) => {
  return arr.filter((info) => info.SplitType === splitType);
};

const httpPostTpss = (req, res) => {
  const { ID, Amount, Currency, Email, SplitInfo } = req.body;

  let response;
  let balance = Amount;
  let splitInfo = SplitInfo;
  let splitBreakdown = [];

  if (splitInfo.length > 0 && splitInfo.length <= 20) {
    let flatDetails = sortArray(splitInfo, "FLAT");
    let percentageDetails = sortArray(splitInfo, "PERCENTAGE");
    let ratioDetails = sortArray(splitInfo, "RATIO");

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
      let totalRatio;
      if (ratioDetails.length === 1) {
        totalRatio = ratioDetail.SplitValue;
      } else {
        totalRatio = ratioDetails.reduce(reducer);
      }
      console.log(totalRatio);

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
