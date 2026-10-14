# Approve or reject operations

As a Manager, I want to review each registered operation before it is completed, so that no sale closes with a wrong price, missing payment or irregular paperwork.

Every operation moves money and a vehicle's ownership, so a single error can be costly. A final review by the Manager acts as a control point before the operation becomes official.

## Acceptance criteria

* The system shows only operations with status “Pending approval”.
* The system shows the inspection, documents, price breakdown, payment and contract of each operation.
* The system blocks approval when the payment or the contract is missing.
* The system sets approved operations to “Completed”, generates the receipt, updates the car's status and records the stock movement.
* The system requires a reason to reject and returns the car to its previous status.
* The system notifies the Employee and the customer of the decision.
* The system allows only users with the Manager role to approve or reject.
* The system logs: date (local time), manager ID, TradeId, decision and reason.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] All unit tests pass (green).
* [ ] The functional analyst (product owner) has approved the feature.
* [ ] At least one automated test has been created for this feature and it passes.
* [ ] The continuous integration server reports no errors.

## Dificulty of implementacion 3/5