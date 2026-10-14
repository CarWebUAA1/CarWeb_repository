#  Offer my car for sale

As a registered User, I want to offer my car to the dealership and get an estimated priceSo that I know how much I could receive before going in person.

The dealership also buys cars from customers to renew its inventory. An online estimate attracts sellers, but the final price depends on the physical inspection of the car.

## Acceptance criteria

* The system requires the User to be logged in.
* The system asks for brand, model, year, version, mileage, fuel type, transmission, color and at least 3 photos.
* The system must validate that the year is between 1990 and the current year and that the mileage is a positive number.
* The system accepts JPG or PNG photos of up to 5 MB each.
* The system shows the price labeled “Estimated – subject to inspection”.
* The system creates the sale request with status “In progress” only if the User accepts the estimate.
* The system notifies an Employee of the request.
* The system logs: date (local time), ClientId, TradeId and estimated price.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] The continuous integration server reports no errors.
* [ ] The system enforces minimum price limit and blocks invalid price inputs
* [ ] The user can edit their listing price within allowed system rules and cooldown limits
* [ ] The system logs price modifications and applies defined policies and restrictions



## Dificulty of implementacion 4/5