# Generate the contract

As an employee, I want the contract to be generated automatically from the operation's data So that I don't retype information and make mistakes

Typing a contract by hand for every operation is slow and error-prone, and a wrong VIN or name can invalidate it. Generating it from data already in the system removes those errors.

## Acceptance criteria

* The system includes the customer's data, the vehicle's data (VIN, plates, mileage) and the operation's data (type, price, payment method, date).
* The system assigns a unique contract number.
* The system must validate that all mandatory fields exist before generating the contract.
* The system allows printing or downloading the contract as PDF.
* The system allows retrying when generation fails.
* The system logs: date (local time), employee ID, TradeId and contract number.

## Definition of done

* [ ] The code has been fully reviewed across successive commits.
* [ ] The continuous integration server reports no errors.
* [ ] Validation of mandatory fields and duplicate serial numbers has been tested.
* [ ] Inspection history lookup has been verified.
* [ ] All unit tests pass (green).

## Dificulty of implementacion 4/5