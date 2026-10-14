#  Request to buy a car

As a registered User, I want to request the purchase of a car from the catalog So that it is reserved for me while I complete the paperwork.

The purchase is not closed online: payment, documents and signing happen at the dealership. Reserving the car prevents another customer from buying it in the meantime and gives the dealership a sale in progress to follow up on.

## Acceptance criteria

* The system requires the User to be logged in.
* The system must validate that the car is still “Available” when confirming.
* The system shows the final price and the payment methods (cash, bank transfer, financing) before confirming.
* The system creates the request (Trades) with status “In progress” and changes the car to “Reserved”.
* The system automatically releases the car if the request does not move forward within 72 hours.
* The system shows the list of documents the User must bring and invites them to schedule an appointment.
* The system does not reserve the car if an error occurs while saving the request.
* The system notifies an Employee of the new request.
* The system logs: date (local time), ClientId, TradeId, CarId and price.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] The continuous integration server reports no errors.

## Dificulty of implementacion 4/5