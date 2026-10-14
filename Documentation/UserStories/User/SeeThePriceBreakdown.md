#  Schedule an appointment

As a registered User, I want to see how the final price was calculated
So that I trust that the price is fair

A price without an explanation creates distrust and haggling. Showing the base price and each adjustment makes the operation transparent and reduces disputes at the dealership.

## Acceptance criteria

* The system shows the base price, each condition adjustment (mileage, tires, damage), the charges and the discounts.
* The system must validate that the final price is greater than zero.
* The system warns the User and notifies the Manager when the car has no base price recorded.
* The system replaces the estimate with the new breakdown when the inspection changes the car's condition.
* The system stores the breakdown with the operation.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] The continuous integration server reports no errors.
* [ ] The user has scheduled appointment with an employee successfully
* [ ] The database updates employee availability and schedule status instantly 
* [ ] The system enforces scheduling rules (block double booking and invalid times)

## Dificulty of implementacion 4/5