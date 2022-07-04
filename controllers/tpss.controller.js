const httpPostTpss = (req, res) => {
  const { ID, Amount, Currency, Email, SplitInfo } = req.body;

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
      }
    });

    percentageDetails.forEach((percentageDetail) => {
      let splitValue = percentageDetail.SplitValue;
      let splitEntityId = percentageDetail.SplitEntityId;

      if (splitValue >= 0) {
        let percentValue = (splitValue / 100) * balance;
        balance -= percentValue;
        splitBreakdown.push({
          SplitEntityId: splitEntityId,
          Amount: percentValue,
        });
      }
    });

    let totalRatio = 0;
    let ratioValue = 0;

    ratioDetails.forEach((ratioDetail) => {
      let splitValue = ratioDetail.SplitValue;

      if (splitValue >= 0) {
        totalRatio += splitValue;
      }
    });

    ratioDetails.forEach((ratioDetail) => {
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
  }

  const response = {
    ID: ID,
    Balance: balance,
    SplitBreakdown: splitBreakdown,
  };

  res.status(200).json(response);
};

module.exports = { httpPostTpss };
