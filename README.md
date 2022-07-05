**TABLE OF CONTENT**

1. [LannisterPay (TPSS)](#lannisterpay-tpss "LannisterPay (TPSS)")
2. [Requirement I (Endpoint)](#requirement-I "Requirement I (Endpoint)")
3. [Requirement II (Split computation rules)](#requirement-II "Requirement II (Split computation rules)")
4. [Requirement III (Constraints)](#requirement-III "Requirement III (Constraints)")
5. [Task Submission](#task-submission "Task Submission")
6. [FAQS](#faqs "FAQS")

***
***
***

# <span id="lannister-pay">LannisterPay (TPSS)</span>

LannisterPay has reached out to you to help implement a transaction payment splitting service (TPSS). The service is meant to calculate the amount due to one or more split payment "entities" as well as the amount left after all splits have been computed.

Your task for this assessment is to create a NodeJS API service that implements the TPSS requirements shared by LannisterPay as described below.

## <span id="requirement-I">Requirement I (Endpoint)</span>

Your API service should expose a single ```HTTP POST``` endpoint ```/split-payments/compute``` that accepts a transaction object with the following properties:

* ```ID``` Unique numeric ID of the transaction
* ```Amount``` Amount to be splitted between the split entities defined in the SplitInfo array (see below)
* ```Currency``` The currency of the transaction
* ```CustomerEmail``` Email address of the transaction customer
* ```SplitInfo``` An array of split entity objects. Each object conatins the fields below:
  * ```SplitType``` This defines how the split amount for the entity is calculated. It has 3 possible values, ```"FLAT", "PERCENTAGE" AND "RATIO"```
  * ```SplitValue``` This is used together with the ```SplitType``` to determine the final value of the split amount for the entity. Example, a ```SplitType``` of ```FLAT``` and ```SplitValue``` of ```45``` means the split entity ```gets NGN 45.``` Another example, A ```SplitType``` of ```PERCENTAGE``` and ```SplitValue``` of ```3``` means the split entity gets 3 percent of the transaction amount or Balance. You can read more about split computation under the ```Requirement II (Split computation rules)``` section.
  * ```SplitEntityId``` This is the unique identifier for the split entity.

**Sample Payload:**:

    {
        "ID": 1308,
        "Amount": 12580,
        "Currency": "NGN",
        "CustomerEmail": "anon8@customers.io",
        "SplitInfo": [
            {
                "SplitType": "FLAT",
                "SplitValue": 45,
                "SplitEntityId": "LNPYACC0019"
            },
            {
                "SplitType": "RATIO",
                "SplitValue": 3,
                "SplitEntityId": "LNPYACC0011"
            },
            {
                "SplitType": "PERCENTAGE",
                "SplitValue": 3,
                "SplitEntityId": "LNPYACC0015"
            }
        ]
    }

If your computation is successful, your endpoint should return with the 200 0K HTTP code and a single object containing the following fields:

* ```ID``` The unique id of the transaction. This should be the same type and value as the ID value of the transaction object that was passed in the request.
* ```Balance``` The amount left after all split values have been computed. It should always be greater than or equal to zero.
* ```SplitBreakdown``` An array containing the breakdown of your computed split amounts for each split entity that was passed via the ```SplitInfo``` array in the request. It should contain the following fields:
  * ```SplitEntityId``` The unique identifier for the split entity.
  * ```Amount``` The amount due to the split entity

Sample Response:

    {
        "ID": 1308,
        "Balance": 0,
        "SplitBreakdown": [
            {
                "SplitEntityId": "LNPYACC0019",
                "Amount": 5000
            },
            {
                "SplitEntityId": "LNPYACC0011",
                "Amount": 2000
            },
            {
                "SplitEntityId": "LNPYACC0015",
                "Amount": 2000
            }
        ]
    }

## <span id="requirement-II">Requirement II (Split computation rules)</span>

The ```SplitBreakdown``` should be computed using the following rules:

**= Rule 1 =**

Each split calculation should be based on the ```Balance``` after the previous calculation's done. At the start of your split calculation, your Balance should be same as the transaction ```Amount```. It then subsequently decreases by the value of the split amount computed for each item in the ```SplitInfo``` array. What this means is, if you have an example request like the below:

    {
        "ID": 13082,
        "Amount": 4500,
        "Currency": "NGN",
        "CustomerEmail": "anon8@customers.io",
        "SplitInfo": [
            {
                "SplitType": "FLAT",
                "SplitValue": 450,
                "SplitEntityId": "LNPYACC0019"
            },
            {
                "SplitType": "FLAT",
                "SplitValue": 2300,
                "SplitEntityId": "LNPYACC0011"
            }
        ]
    }

Your computation ```Balance``` progression should look something like this:

    Initial Balance: 
    4500

    Split amount for "LNPYACC0019": 450
    Balance after split calculation for "LNPYACC0019": (4500 - 450)
    4050

    Split amount for "LNPYACC0011": 2300
    Balance after split calculation for "LNPYACC0011": (4050 - 2300)
    1750

    Final Balance: 1750

The sample JSON response for the above:

    {
        "ID": 13082,
        "Balance": 1750,
        "SplitBreakdown": [
            {
                "SplitEntityId": "LNPYACC0019",
                "Amount": 450
            },
            {
                "SplitEntityId": "LNPYACC0011",
                "Amount": 2300
            }
        ]
    }

**= Rule 2 =**

The order of precedence for the ```SplitType``` is:

1. ```FLAT``` types should be computed before ```PERCENTAGE``` OR ```RATIO``` types
2. ```PERCENTAGE``` types should be computed before ```RATIO``` types.
3. ```RATIO``` types should always be computed last.

What the above means is, if you have an example request like the below:

    {
        "ID": 13092,
        "Amount": 4500,
        "Currency": "NGN",
        "CustomerEmail": "anon8@customers.io",
        "SplitInfo": [
            {
                "SplitType": "FLAT",
                "SplitValue": 450,
                "SplitEntityId": "LNPYACC0019"
            },
            {
                "SplitType": "RATIO",
                "SplitValue": 3,
                "SplitEntityId": "LNPYACC0011"
            },
            {
                "SplitType": "PERCENTAGE",
                "SplitValue": 3,
                "SplitEntityId": "LNPYACC0015"
            },
            {
                "SplitType": "RATIO",
                "SplitValue": 2,
                "SplitEntityId": "LNPYACC0016"
            },
            {
                "SplitType": "FLAT",
                "SplitValue": 2450,
                "SplitEntityId": "LNPYACC0029"
            },
            {
                "SplitType": "PERCENTAGE",
                "SplitValue": 10,
                "SplitEntityId": "LNPYACC0215"
            },
        ]
    }

Your split amount computation should progress like this:

        Initial Balance: 
        4500

        FLAT TYPES FIRST
        Split amount for "LNPYACC0019": 450
        Balance after split calculation for "LNPYACC0019": (4500 - 450)
        4050

        Split amount for "LNPYACC0029": 2450
        Balance after split calculation for "LNPYACC0029": (4050 - 2450)
        1600

        PERCENTAGE TYPES COME NEXT
        Split amount for "LNPYACC0015": (3 % OF 1600) = 48
        Balance after split calculation for "LNPYACC0015": (1600 - (48))
        1552

        Split amount for "LNPYACC0215": (10 % OF 1552) = 155.2
        Balance after split calculation for "LNPYACC0015": (1552 - (155.2))
        1396.8

        FINALLY, RATIO TYPES
        TOTAL RATIO = 3 + 2 = 5
        Opening Ratio Balance = 1396.8

        Split amount for "LNPYACC0011": ((3/5) * 1396.8) = 838.08
        Balance after split calculation for "LNPYACC0011": (1396.8 - (838.08))
        558.72

        Split amount for "LNPYACC0016": ((2/5) * 1396.8) = 558.72
        Balance after split calculation for "LNPYACC0016": (558.72 - (558.72))
        0

        Final Balance: 0

One other thing to note from the above, the ```Balance``` used to compute the split amount for all entities with the ```RATIO``` type is the same (i.e the Opening Ratio Balance, 1396.8). This makes ```RATIO``` computation different from the ```FLAT``` and ```PERCENTAGE``` types where the split amount is based on the previous balance.

The sample JSON response for the above:

    {
        "ID": 13092,
        "Balance": 0,
        "SplitBreakdown": [
            {
                "SplitEntityId": "LNPYACC0019",
                "Amount": 450
            },
            {
                "SplitEntityId": "LNPYACC0011",
                "Amount": 2450
            },
            {
                "SplitEntityId": "LNPYACC0015",
                "Amount": 48
            },
            {
                "SplitEntityId": "LNPYACC0215",
                "Amount": 155.2
            },
            {
                "SplitEntityId": "LNPYACC0011",
                "Amount": 838.08
            },
            {
                "SplitEntityId": "LNPYACC0016",
                "Amount": 558.72
            }

        ]
    }

## <span id="requirement-III">Requirement III (Constraints)</span>

1. The ```SplitInfo``` array can contain a minimum of 1 split entity and a maximum of 20 entities.
2. The final ```Balance``` value in your response cannot be lesser than 0.
3. The split ```Amount``` value computed for each entity cannot be greater than the transaction ```Amount```.
4. The split ```Amount``` value computed for each entity cannot be lesser than 0.
5. The sum of all split Amount values computed cannot be greated than the transaction ```Amount```.
6. Your API service response time should not be more than 80ms (Milliseconds).

## <span id="task-submission">Task Submission</span>

Once done with your implementation, you can submit a link to your API using this [Google Forms link](https://docs.google.com/forms/d/e/1FAIpQLSfKMx_SyVNwWkZA43AQxjoJMsuTnBwoz4TCcwbBNNPDvmh_Ng/viewform "Google Forms submission link").

## <span id="faqs">FAQS</span>

**#1**
**Can I use typescript?**

*Yes, you can - Vanilla Javascript is preferred though.*

**#2**
**Am I allowed to use 3rd party frameworks and or libraries?**

*Yes, you can use any framework or library you want.*

**#3**
**Can I host my service using Heroku?**

*Yes, you can use Heroku as the host of choice for your API. You can also use any accessible hosts you are comfortable with (Glitch, CodeSandbox, DigitalOcean, AWS, Google App Engine e.t.c.)*

**#4**
**How will this assessment be graded?**

*The assessment will be graded using two criteria. First, the correctness of your response. Second, whether or not your API responded in less than 80ms. Each API URL will be tested with 20 different unique transaction objects. Total obtainable score is 40 points. (2 points per transaction object. First point for correctness in computing the split amounts and final balance. Second point for responding in less than 80ms)*

**#5**
**I want to use Heroku to host my API, won't this affect my response time seeing as the free version sleeps after a cerain idle time.**

*This will not be an issue. Each submitted API URL will be pinged with an initial wait time of 60 seconds before any tests are run.*

**#6**
**The split amount calculations could result in long decimal values, can I round up or set the values to 2 dp?**

*No, you cannot. Return the decimal values as computed - no approximations or formatting.*
