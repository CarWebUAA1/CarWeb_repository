# Buy Spare Parts 

As a registered User, I want to buy spare parts compatible with my car
So that I can repair it at a lower cost

Cars that are no longer fit for sale are used as spare parts. Selling them generates extra revenue from inventory that would otherwise go unsold.

## Acceptance criteria

* The system requires the User to be logged in to buy.
* The system allows filtering spare parts by compatible brand and model.
* The system must validate that the part is still available when the purchase is confirmed.
* The system never charges the User if the part was already sold to another customer.
* The system changes the part to “Sold”, records the stock exit and generates a receipt.
* The system logs: date (local time), ClientId, PartId and amount.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] The continuous integration server reports no errors.
* [ ] At least one automated test has been created for this feature and it passes.
* [ ] The continuous integration server reports no errors.

## Dificulty of implementacion 3/5